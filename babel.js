#!/usr/bin/env node

/*
 * Copyright (c) 2016 Kelvin W Sherlock <ksherlock@gmail.com>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */


"use strict";
/*
 * babel [options] files...
 * like babel cli, but you can actually use it.
 *
 */

var babel = require('babel-core');
var fs = require("fs");
const EX = require('sysexits');

var getopt_long = require('./getopt').getopt_long;
var getsubopt = require('./getsubopt');
var data = require('./data');

function _(x) {
	return Array.isArray(x) ? x : [x];
}

/* delete and re-insert a key in a map so it shuffles to the end */
function move_back(map, key) {

	if (map.has(key)) {
		let tmp = map.get(key);
		map.delete(key);
		map.set(key, tmp);
	}
}

function transform(code, options) {
	var ex;
	try {
		return babel.transform(code, options);
	}
	catch(ex) {
		console.warn(ex.message);
		if (ex.codeFrame)
			console.warn(ex.codeFrame);

		process.exit(EX.DATAERR);
	}
}

function transformFile(file, options) {
	var ex;
	try {
		return babel.transformFileSync(file, options);
	}
	catch(ex) {
		console.warn(ex.message);
		if (ex.code === 'ENOENT')
			process.exit(EX.NOINPUT);

		if (ex.codeFrame)
			console.warn(ex.codeFrame);

		process.exit(EX.DATAERR);
	}
}

function read_stdin() {

	return new Promise(function(resolve, reject){
		var rv = '';
		var stdin = process.stdin;
		stdin.setEncoding("utf8");

		stdin.on("readable", function () {
			var chunk;
			while (chunk = stdin.read()) {
				rv += chunk;
			}
		});

		stdin.on("end", function () {
			resolve(rv);
		});
	})
}

function coerce_type(v, t) {
	if (t == Array) return v.split((/\s*;\s*/)).filter( (x) => x.length > 0);
	if (t == Boolean) {
		switch(v) {
			case undefined: // 'tdz' => key=tdz, value=undefined ... so treat as true.
			case null:
			case "true":
				return true;
			case "false":
			case "":
			case "0":
				return false;
			case true:
			case false:
				return v;
			default:
				var x = Number.parseInt(v,10);
				if (Number.isNaN(x)) return false;
				return x != 0;
		}
	}
	if (t == Number) {
		if (v.match(/^0x/)) return Number.parseInt(v, 16);
		return Number.parseInt(v, 10);
	}

	return v;
}


function coerce_types(data, keys) {

	var lookup = function(o,k) {
		return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : void(0);
	};

	var rv = {};
	Object.keys(data).forEach((k) => {

		var v = data[k];
		var type = lookup(keys, k);

		rv[k] = coerce_type(v, type);

	});

	return rv;
}

/* move unknown options into a child object. */
function splatify(data, keys) {
	
	var splat = {};
	var rv = {};

	var lookup = function(o,k) {
		return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : void(0);
	};

	// find the splat object in keys
	Object.keys(keys).forEach( (k) => {
		if (keys[k] === Object) rv[k] = splat;
	});

	Object.keys(data).forEach((k) => {

		var v = data[k];
		var type = lookup(keys, k);

		switch(type) {
		case Object: // same name as the splat key.
		case undefined:
			splat[k] = v;
			break;
		default:
			rv[k] = coerce_type(v, type);
			break;
		}

	});

	return rv;
}

function version() {
	var pkg = require('./package.json');
	console.log(`better-babel-cli version ${pkg.version}`);
}

function help_presets(verbose) {

	console.log("Presets:");

	var x = [];
	data.presets.forEach(function(v,k) { x.push(k); });
	x.sort();
	x.forEach(function(k){
		console.log(`    --${k}`);
		if (verbose) {
			var y = data.presets.get(k).map(function(k){
				return Array.isArray(k) ? k[0] : k;
			});
			y.sort();
			y.forEach(function(k){
				console.log(`        ${k}`);
			});
			console.log("");
		}
	});
}

function help_plugins() {

	console.log("Plugins:");

	var x = [];
	data.plugins.forEach(function(k) { x.push(k); });
	x.sort();
	x.forEach(function(k){console.log(`    --${k}`); });
}

function config_str(o) {

	return Object.keys(o).map(function(k){
		return `${k}=${o[k].name}`;
	}).join(',');
}
function help_config() {

	console.log("Configuration:");

	data.config.forEach(function(v, k) { 
		console.log(`--${k} ${config_str(v)}`);
	});
}

function help(exitcode) {

	console.log("babel [options] infile...");
	console.log("");
	console.log("Options:");
	console.log("    -o [outfile]             Write output to file.");
	console.log("    -h, --help               Display usage information.");
	console.log("    --help-presets           Display presets.");
	console.log("    --help-plugins           Display plugins.");
	console.log("    --help-config            Display plugin configuration.");
	console.log("    -v, --[no-]verbose       Enable/Disable verbose mode.");
	console.log("    -V, --version            Display version information.");
	console.log("    --[no-]babelrc           Enable/Disable .babelrc.");
	console.log("    --[no-]comments          Enable/Disable comments.");
	console.log("    --[no-]compact           Enable/Disable compaction.");
	console.log("    --loose                  Enable loose mode.");
	console.log("    --spec                   Enable spec mode.");
	console.log("    --tdz                    Enable tdz mode.");
	console.log("    --preset [name]          Enable specified preset.");
	console.log("    --[no-]plugin [plugin]   Enable/Disable specified plugin.");

	/*
	console.log("");
	help_presets();

	console.log("");
	help_plugins();
	*/
	process.exit(exitcode);
}

var nono = new Map();
var plugins = new Map();
var verbose = false;
var outfile = null;
var ex;
var loose = false;
var spec = false;
var tdz = false;

var babelrc = {
	babelrc: false,
	plugins: []
};

var go = [ "help", "help-plugins", "help-presets", "help-config",
	"verbose!", "version", "babelrc!", "comments!", "compact!", "loose!", "spec!", "tdz!"];

// add pre-sets
data.presets.forEach(function(v, k){
	go.push(k);
});


// add plug-ins.
data.plugins.forEach(function(k){
	var m;
	go.push(`${k}:s`);
	go.push(`no-${k}`);

	nono.set(`no-${k}`, k);


	// --transform-this-that == --this-that
	if (m = k.match(/^transform-(.+)$/)) {
		var k2 = m[1];
		go.push(`${k2}:s`);
		go.push(`no-${k2}`);

		nono.set(`no-${k2}`, k);
	}
});

var argv = getopt_long(process.argv.slice(2), "hVvo:", go,
	function(key, optarg) {

		switch(key) {
			case ':':
			case '?':
				// optarg is an Error object.
				console.warn(optarg.message);
				process.exit(EX.USAGE);
				break;

			case 'h':
			case 'help':
				help(EX.OK);
			case 'help-plugins':
				help_plugins();
				process.exit(EX.OK);

			case 'help-presets':
				help_presets(true);
				process.exit(EX.OK);

			case "help-config":
				help_config();
				process.exit(EX.OK);

			case 'V':
			case 'version':
				version();
				process.exit(EX.OK);

			case 'v':
				verbose = true;
				break;

			case 'verbose':
				verbose = optarg;
				break;

			case 'babelrc':
				babelrc.babelrc = optarg;
				break;

			case 'comments':
				babelrc.comments = optarg;
				break;

			case 'compact':
				babelrc.compact = optarg;
				break;

			case 'loose':
				loose = optarg;
				break;

			case 'spec':
				spec = optarg;
				break;

			case 'tdz':
				tdz = optarg;
				break;


			case 'o':
				if (optarg === '-') optarg = null;
				outfile = optarg;
				break;

			default:
				// --preset ?
				var x = key;
				if (data.presets.has(x)) {
					data.presets.get(x).forEach(function(k){
						if (Array.isArray(k)) {
							plugins.set(k[0], k[1]);
						} else {
							plugins.set(k, {});
						}
					});
					break;
				}

				// --no plugin?
				if (nono.has(x)) {
					plugins.delete(nono.get(x));
					break;
				}

				// --plugin?
				if (data.plugins.has(x)) {
					plugins.set(x, optarg ? getsubopt(optarg) : {});
					break;
				}

				x = 'transform-' + key;
				if (data.plugins.has(x)) {
					plugins.set(x, optarg ? getsubopt(optarg) : {});
					break;
				}


				console.warn(`Unknown plugin/preset: ${key}`);
				process.exit(EX.USAGE);
				break;
		}
});


/*
 * NOTE: Order of Plugins Matters!
 *
 * If you are including your plugins manually and using transform-class-properties, 
 * make sure that transform-decorators[-legacy] comes before transform-class-properties.
 */

/* turns out the above advice is backwards.... */

// should also check for conflicts, eg, react / vue / inferno.

if (plugins.has('transform-class-properties')) {
	move_back(plugins, 'transform-decorators');
	move_back(plugins, 'transform-decorators-legacy');
}




// special handling for config options that go into a child object
plugins.forEach(function(value,key,map){

	var config = data.config.get(key);
	switch(key) {
		case 'transform-es2015-modules-umd':
		case 'minify-mangle-names':
			value = splatify(value, config);
			map.set(key, value);
			break;
		case 'minify-replace':
			// todo -- overly complicated structure...
			break;
		default:
			value = coerce_type(value, config);
			map.set(key, value);
			break;
	}

});

if (loose) {
	plugins.forEach(function(value, key, map){
		var x = data.config.get(key);
		if (x && x.loose === Boolean) value.loose = true;
	});
}

if (spec) {
	plugins.forEach(function(value, key, map){
		var x = data.config.get(key);
		if (x && x.spec === Boolean) value.spec = true;
	});
}

if (tdz) {
	plugins.forEach(function(value, key, map){
		var x = data.config.get(key);
		if (x && x.tdz === Boolean) value.tdz = true;
	});
}


plugins.forEach(function(value,key,map){
	if (verbose) console.warn(`requiring ${key}`);
	var x, y, ex;

	try {
		x = `./babel-plugin/${key}.js`;
		y = require(x);
		y =  y.__esModule ? y.default : y;
		babelrc.plugins.push([y, value]);
		return;
	} catch(ex) {}

	try {
		x = `babel-plugin-${key}`;
		y = require(x);
		y =  y.__esModule ? y.default : y;
		babelrc.plugins.push([y, value]);
		return;
	} catch(ex) {
		console.warn(`Unable to load plugin ${key}`);
		console.warn(ex.message);
	}

});

var fd = -1;
if (outfile) {
	try {
		fd = fs.openSync(outfile, 'w', 0o666);
	} catch(ex) {
		console.warn(ex.message);
		process.exit(EX.CANTCREAT);
	}
}

if (argv.length) {
	argv.forEach(function(infile){
		babelrc.filename = infile;
		if (verbose) console.warn(`transforming ${infile}`);
		var result = transformFile(infile, babelrc);

		if (outfile) {
			fs.appendFileSync(fd, result.code);
			fs.appendFileSync(fd, "\n");
		}
		else {
			process.stdout.write(result.code);
			process.stdout.write("\n");
		}
	});
	if (fd != -1) fs.closeSync(fd);
	process.exit(EX.OK);
}

// read from stdin....

if (verbose) console.warn(`transforming stdin`);
read_stdin().then(function(code){

	babelrc.filename="<stdin>";
	var result = transform(code, babelrc);

	if (outfile) {
		fs.appendFileSync(fd, result.code);
		fs.appendFileSync(fd, "\n");
		fs.closeSync(fd);
	}
	else {
		process.stdout.write(result.code);
		process.stdout.write("\n");
	}
	process.exit(EX.OK);

});

