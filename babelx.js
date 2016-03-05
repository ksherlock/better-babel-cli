#!/usr/bin/env node

/*
 * babelx --plugins=...,... --preset=...,... --no=....
 *
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
	var x = [];

	console.log("babelx [options] infile...");
	console.log("");
	console.log("options:");
	console.log("    -o outfile");
	console.log("    -h / --help");
	console.log("    -v / --verbose");
	console.log("    --preset");
	console.log("    --plugin");
	console.log("    --no-plugin");

	console.log("");
	console.log("plugins:");

	data.presets.forEach(function(v,k) { x.push(k); });
	x.sort();
	x.forEach(function(k){console.log(`    --${k}`)});

	console.log("");
	console.log("presets:");

	data.plugins.forEach(function(k) { x.push(k); });
	x.sort();
	x.forEach(function(k){console.log(`    --${k}`)});


	process.exit(exitcode);
}

var plugins = new Set();
var verbose = false;
var outfile = null;

var argv = getopt(process.argv.slice(2), 
	{ shortargs: 'o' },
	function(key, value) {

		switch(key) {
			case '-h':
			case '--help':
				help(0);

			case '-v':
			case '--verbose':
				verbose = true;
				break;

			case '-o':
				if (!value) {
					console.log('-o requires an argument.');
					help(1);
				}
				if (value == '-') value = null;
				outfile = value;
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
						plugins.add(x);
						break;
					}
					x = 'transform-' + x;
					if (data.plugins.has(x)) {
						plugins.add(x);
						break;
					}
				}
				// --no-plugin
				if (key.substr(0,5) == '--no-') {
					x = key.substr(5);
					if (data.plugins.has(x)) {
						plugins.delete(x);
						break;
					}
					x = 'transform-' + x;
					if (data.plugins.has(x)) {
						plugins.delete(x);
						break;
					}
				}

				console.log(`unsupported option: ${key}.`);
				help(1);
				break;
		}


});

var options = {};

/*
argv.presets && _(argv.presets).forEach(function(arg){
	arg = arg.split(',');
	arg.forEach(function(arg){
		if (arg == '') return;
		if (!data.presets.has(arg)) {
			console.log(`Invalid preset: ${arg}`);
			return;
		}
		data.presets.get(arg).forEach(function(k){
			plugins.add(k);
		});
	});
});

argv.plugins && _(argv.plugins).forEach(function(arg){
	arg = arg.split(',');
	arg.forEach(function(arg){
		if (arg == '') return;
		plugins.add(arg);
	});
});
*/

options.plugins = [];

plugins.forEach(function(value,key,map){
	if (verbose) console.log(`requiring ${key}`);
	var x;
	try {
		x = 'babel-plugin-' + key;
		require(x);
		options.plugins.push(x);
		return;
	} catch (exception) {}

	try {
		x = 'babel-plugin-transform-' + key;
		require(x);
		options.plugins.push(x);
		return;
	} catch (exception) {}

	console.warn(`Unable to find plugin ${key}`);
});

var fd = -1;
if (outfile) {
	try {
		fd = fs.openSync(outfile, 'w', 0666);
	} catch (e) {
		//console.log(`Error opening ${outfile}`);
		console.log(e.message);
		process.exit(1);
	}
}

if (argv.length) {
	argv.forEach(function(infile){
		options.filename = infile;
		//var code = fs.readFileSync(infile);
		if (verbose) console.log(`transforming  ${infile}`);
		var result = transformFile(infile, options);

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

read_stdin().then(function(code){

	options.filename="<stdin>";
	var result = transform(code, options);

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

