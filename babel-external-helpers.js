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


var fs = require("fs");

var babel = require('babel-core');
const EX = require('sysexits');
var getopt_long = require('./getopt').getopt_long;
var bh = require('babel-helpers');
var bt = require('babel-types');
var bg = require("babel-generator");

var opts = {
	o: null,
	l: null,
	t: 'global'
};

const formats = new Set(["export","global", "umd", "var", "runtime"]);



/*
 * returns true if directory created, false if directory previously existed
 * throws on error.
 */
function xmkdir(path, mode) {
	var ex, error;
	try {
		fs.mkdirSync(path, mode);
		return true;

	} catch(ex) {error = ex} ;

	try {
		var stats = fs.statSync(path);
		if (stats.isDirectory()) return false;
	} catch(ex) {}

	throw error;
}

function iterate_functions(whitelist, callback) {

	var list = bh.list;
	list.forEach( function(fn){
		if (whitelist && whitelist.indexOf(fn) < 0) return;

		callback(fn, bh.get(fn));
	});
}


/*
 * As of 4/18/2016, buildExternalHelpers does not support export 
 * (a pull request has been submitted)
 *
 */

function buildExternalHelpers(list, type) {
	var ex;
	try {
		return babel.buildExternalHelpers(list, type); 
	} catch (ex) {
		if (type === 'export') return buildExports(list);
	}
}




function buildExports(whitelist) {

	var body = [];
	var exports = [];

	iterate_functions(whitelist, function(fn, template){

		var _key = bt.identifier("_" + fn);
		var key = bt.identifier(fn);

		body.push(
			bt.variableDeclaration("var", [
				bt.variableDeclarator(_key, template)
			])
		);

		exports.push(bt.exportSpecifier(_key, key));
	});

	body.push(
		bt.exportNamedDeclaration(
			null,
			exports,
			null
		)
	);

	var tree = bt.program(body);
	var code = bg.default(tree).code;
	return code;
}

function buildRuntime(path, whitelist) {
	var ex;

	path = path || '';
	if (path) path += '/';

	try {
		path += "babel-runtime"
		xmkdir(path);
		path += "/helpers"
		xmkdir(path);
	} catch (ex) {
		console.log(ex.message);
		process.exit(EX.CANTCREAT);
	}

	var _default = bt.identifier("default");
	iterate_functions(whitelist, function(fn, template){

		var _key = bt.identifier("_" + fn);
		var body = [];

		body.push(
			bt.variableDeclaration("var", [
				bt.variableDeclarator(_key, template)
			])
		);

		body.push(
			bt.exportNamedDeclaration(
				null,
				[bt.exportSpecifier(_key, _default)],
				null
			)
		);
		var tree = bt.program(body);
		var code = bg.default(tree).code;
		fs.writeFileSync(`${path}/${fn}.js`, code + "\n");
	});
}


function help(exitcode) {

	console.log("babel-external-helpers [options]");
	console.log("");
	console.log("Options:");
	console.log("    -o [outfile]             Write output to file.");
	console.log("    -h, --help               Display usage information.");
	console.log("    -l, --whitelist [list]   Whitelist of helpers to ONLY include.");
	console.log("    -t, --output-type [type] Type of output (export|global|umd|var).");

	process.exit(exitcode);
}

function version() {
	var pkg = require('./package.json');
	console.log(`better-babel-external-helpers version ${pkg.version}`);
}

var argv = getopt_long(null, "hl:t:o:V", ["help","whitelist=s","output-type=s", "version"], function(arg, optarg){

	switch(arg) {
		case 'help':
		case 'h':
			help(EX.OK);
			break;

		case 'V':
		case 'version':
			version();
			process.exit(EX.OK);
			break;

		case 'l':
		case 'whitelist':
			opts.l = optarg.split(',')
				.map( x => x.replace(/^\s+|\s+$/,'','g') )
				.filter( x => !!x.length )
			;
			break;
		case 't':
		case 'output-type':
			opts.t = optarg;
			break;
		case 'o':
			opts.o = optarg === '-' ? null : optarg;
			break;
	}

});

if (opts.t === "runtime") {
	buildRuntime(opts.o, opts.l);
	process.exit(EX.OK);
}

var ex;
var code;

try {
	code = buildExternalHelpers(opts.l, opts.t);
} catch (ex) {
	console.log(ex.message);
	process.exit(EX.USAGE);
}

code += "\n";

if (opts.o) {
	var fd;
	try {
		fd = fs.openSync(opts.o, 'w', 0o666);
	} catch(ex) {
		console.warn(ex.message);
		process.exit(EX.CANTCREAT);
	}

	fs.writeFileSync(fd, code);
	fs.closeSync(fd);
	process.exit(EX.OK);
}

process.stdout.write(code);
process.exit(EX.OK);
