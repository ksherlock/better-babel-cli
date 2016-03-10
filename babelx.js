#!/usr/bin/env node
"use strict";
/*
 * babelx [options] files...
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
	try {
		return babel.transform(code, options);
	}
	catch(e) {
		console.log(e.message);
		console.log(e.codeFrame);
		process.exit(1);
	}
}

function transformFile(file, options) {
	try {
		return babel.transformFileSync(file, options);
	}
	catch(e) {
		console.log(e.message);
		console.log(e.codeFrame);
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


function help(exitcode) {
	var x;

	console.log("babelx [options] infile...");
	console.log("");
	console.log("options:");
	console.log("    -o outfile");
	console.log("    -h / --help");
	console.log("    -v / --verbose");
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


var babelrc = {
	babelrc: false,
	plugins: []
};

var go = { '-o': String, 
	'-h': true, '--help': true, 
	'-v': true, '--verbose': Boolean, 
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
		babelrc.plugins.push(y);
		return;
	} catch (exception) {}

	}

});

var fd = -1;
if (outfile) {
	try {
		fd = fs.openSync(outfile, 'w', /*0666*/ 0x1b6);
	} catch (e) {
		//console.log(`Error opening ${outfile}`);
		console.log(e.message);
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

