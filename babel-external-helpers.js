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


var opts = {
	o: null,
	l: null,
	t: 'global'
};

const formats = new Set(["export","global", "umd", "var"]);



function help(exitcode) {

	console.log("babel-external-helpers [options]");
	console.log("");
	console.log("Options:");
	console.log("    -o [outfile]             Write output to file.");
	console.log("    -h, --help               Display usage information.");
	console.log("    -l, --whitelist [list    Whitelist of helpers to ONLY include.");
	console.log("    -t, --output-type [type] Type of output (export|global|umd|var).");

	process.exit(exitcode);
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
		if (type !== 'export') throw ex;
	}

	return var_to_export(babel.buildExternalHelpers(list, 'var'));
}

function var_to_export(code) {

	var e = new Set();

	var newCode = [];
	code.split("\n").forEach(function(line){
		var m;

		if (line === "babelHelpers;" || line === "var babelHelpers = {};") 
			return;
		if (m = line.match(/^babelHelpers\.([A-Za-z]+) = (.*)$/)) {
			newCode.push(`var _${m[1]} = ${m[2]}`);
			e.add(m[1]);
			return;
		}
		newCode.push(line);
	});

	e.forEach(function(k){
		newCode.push(`export { _${k} as ${k} };`);
	});
	return newCode.join("\n");
}

var argv = getopt_long(null, "hl:t:o:", ["help","whitelist=s","output-type=s"], function(arg, optarg){

	switch(arg) {
		case 'help':
		case 'h':
			help(EX.OK);
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
