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

function version() {
	var pkg = require('./package.json');
	console.log(`better-babel-cli version ${pkg.version}`);
}

function help(exitcode) {
	var x;

	console.log("babel [options] infile...");
	console.log("");
	console.log("options:");
	console.log("    -o outfile");
	console.log("    -h / --help");
	console.log("    -v / --[no-]verbose");
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

var go = [ "help", "verbose!", "version", "babelrc!", "comments!", "compact!"];

// add pre-sets
data.presets.forEach(function(v, k){ go.push(k) });

// add plug-ins.
data.plugins.forEach(function(k){
	var m;
	go.push(k + '!')
	// --transform-this-that == --this-that
	if (m = k.match(/^transform-(.+)$/)) {
		go.push(m[1] + '!');
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
				help(0);

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

			case 'o':
				if (optarg === '-') optarg = null;
				outfile = optarg;
				break;

			default:
				// --preset ?
				var x = key;
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
				var x = 'transform-' + key;
				if (data.plugins.has(x)) {
					optarg ? plugins.add(x) : plugins.delete(x);
					break;
				}

				console.warn(error ? error.message : `Unknown plugin/preset: ${key}`);
				process.exit(EX.USAGE);
				break;
		}
});


plugins.forEach(function(value,key,map){
	if (verbose) console.warn(`requiring ${key}`);
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
