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
var getopt = require('./getopt');
var data = require('./data');

function _(x) {
	return Array.isArray(x) ? x : [x];
}

function transform(code, options) {
	var ex;
	try {
		return babel.transform(code, options);
	}
	catch(ex) {
		console.log(ex.message);
		console.log(ex.codeFrame);
		process.exit(1);
	}
}

function transformFile(file, options) {
	var ex;
	try {
		return babel.transformFileSync(file, options);
	}
	catch(ex) {
		console.log(ex.message);
		console.log(ex.codeFrame);
		process.exit(1);
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

function version() {
	var pkg = require('./package.json');
	console.log(`babel x version ${pkg.version}`);
}

function help(exitcode) {
	var x;

	console.log("babelx [options] infile...");
	console.log("");
	console.log("options:");
	console.log("    -o outfile");
	console.log("    -h / --help");
	console.log("    -v / --verbose");
	console.log("    -V / --version");
	console.log("    --[no-]babelrc");
	console.log("    --[no-]comments");
	console.log("    --[no-]compact");
	console.log("    --preset");
	console.log("    --[no-]plugin");

	console.log("");
	console.log("presets:");

	x = [];
	data.presets.forEach(function(v,k) { x.push(k); });
	x.sort();
	x.forEach(function(k){console.log(`    --${k}`)});

	console.log("");
	console.log("plugins:");

	x = [];
	data.plugins.forEach(function(k) { x.push(k); });
	x.sort();
	x.forEach(function(k){console.log(`    --${k}`)});


	process.exit(exitcode);
}

var plugins = new Set();
var verbose = false;
var outfile = null;
var ex;


var babelrc = {
	babelrc: false,
	plugins: []
};

var go = { '-o': String, 
	'-h': true, '--help': true, 
	'-v': true, '--verbose': Boolean, 
	'-V': true, '--version': true,
	'--babelrc': Boolean,
	'--comments': Boolean,
	'--compact': Boolean,
};

// add pre-sets
data.presets.forEach(function(v, k){ go['--' + k] = true; });

// add plug-ins.
data.plugins.forEach(function(k){
	var m;
	go['--' + k] = Boolean;
	// --transform-this-that == --this-that
	if (m = k.match(/^transform-(.+)$/)) {
		go['--' + m[1]] = Boolean;
	}
});


var argv = getopt(process.argv.slice(2), go,
	function(key, optarg, error) {

		switch(key) {
			case ':':
			case '?':
				console.log(error.message);
				process.exit(1);
				break;

			case '-h':
			case '--help':
				help(0);

			case '-V':
			case '--version':
				version();
				process.exit(0);

			case '-v':
			case '--verbose':
				verbose = optarg;
				break;

			case '--babelrc':
				babelrc.babelrc = optarg;
				break;

			case '--comments':
				babelrc.comments = optarg;
				break;

			case '--compact':
				babelrc.compact = optarg;
				break;

			case '-o':
				if (optarg === '-') optarg = null;
				outfile = optarg;
				break;

			default:
				if (key.substr(0,2) == '--') {
					var x = key.substr(2);

					// --preset ?
					if (data.presets.has(x)) {
						data.presets.get(x).forEach(function(k){
							plugins.add(k);
						});
						break;
					}

					// --plugin?
					if (data.plugins.has(x)) {
						optarg ? plugins.add(x) : plugins.delete(x);
						break;
					}
					x = 'transform-' + x;
					if (data.plugins.has(x)) {
						optarg ? plugins.add(x) : plugins.delete(x);
						break;
					}
				}

				console.log(error ? error.message : `Unknown plugin: ${key}`);
				process.exit(1);
				break;
		}
});


plugins.forEach(function(value,key,map){
	if (verbose) console.log(`requiring ${key}`);
	var x, y;
	try {
		x = 'babel-plugin-' + key;
		y = require(x);
		// .__esModule can get killed before it's normalized.
		// possibly from making a deep copy of the object
		// and not including the __esModule property.
		y =  y.__esModule ? y.default: y;
		babelrc.plugins.push(y);
		return;
	} catch(ex) {
		console.warn(`Unable to load plugin ${key}`);
		console.warn(ex.message);

	}

});

var fd = -1;
if (outfile) {
	try {
		fd = fs.openSync(outfile, 'w', /*0666*/ 0x1b6);
	} catch(ex) {
		//console.log(`Error opening ${outfile}`);
		console.log(ex.message);
		process.exit(1);
	}
}

if (argv.length) {
	argv.forEach(function(infile){
		babelrc.filename = infile;
		if (verbose) console.log(`transforming ${infile}`);
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
	process.exit(0);
}

// read from stdin....

if (verbose) console.log(`transforming stdin`);
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
	process.exit(0);

});

