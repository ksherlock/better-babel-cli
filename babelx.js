/*
 * babelx --plugins=...,... --preset=...,... --no=....
 *
 *
 */

var parseArgs = require('minimist');
var babel = require('babel-core');
var fs = require("fs");

var presets = new Map();

presets.set('react', [
	'syntax-flow',
	'syntax-jsx',
	'transform-flow-strip-types',
	'transform-react-jsx',
	'transform-react-display-name',
]);

presets.set('es2015', [
	'check-es2015-constants',
	'transform-es2015-arrow-functions',
	'transform-es2015-block-scoped-functions',
	'transform-es2015-block-scoping',
	'transform-es2015-classes',
	'transform-es2015-computed-properties',
	'transform-es2015-destructuring',
	'transform-es2015-for-of',
	'transform-es2015-function-name',
	'transform-es2015-literals',
	'transform-es2015-modules-commonjs', // no.
	'transform-es2015-object-super',
	'transform-es2015-parameters',
	'transform-es2015-shorthand-properties',
	'transform-es2015-spread',
	'transform-es2015-sticky-regex',
	'transform-es2015-template-literals',
	'transform-es2015-typeof-symbol',
	'transform-es2015-unicode-regex',
	'transform-regenerator',
]);

// as above but add helpers, remove common-js
presets.set('es2015-rollup', [
	'check-es2015-constants',
	'transform-es2015-arrow-functions',
	'transform-es2015-block-scoped-functions',
	'transform-es2015-block-scoping',
	'transform-es2015-classes',
	'transform-es2015-computed-properties',
	'transform-es2015-destructuring',
	'transform-es2015-for-of',
	'transform-es2015-function-name',
	'transform-es2015-literals',
	'transform-es2015-object-super',
	'transform-es2015-parameters',
	'transform-es2015-shorthand-properties',
	'transform-es2015-spread',
	'transform-es2015-sticky-regex',
	'transform-es2015-template-literals',
	'transform-es2015-typeof-symbol',
	'transform-es2015-unicode-regex',
	'transform-regenerator',
	'external-helpers'
]);

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

var plugins = new Map();


var argv = parseArgs(process.argv.slice(2), {
	alias: { preset: 'presets', plugin: 'plugins'},
	string: [ 'preset', 'presets', 'plugin', 'plugins', 'o']
});

var verbose = !!argv.v;
var outfile = argv.o; if (outfile == '-') outfile = null;
var options = {};

argv.presets && _(argv.presets).forEach(function(arg){
	arg = arg.split(',');
	arg.forEach(function(arg){
		if (arg == '') return;
		if (!presets.has(arg)) {
			console.log('Invalid preset: ' + arg);
			return;
		}
		presets.get(arg).forEach(function(k){
			plugins.set(k, true);
		});
	});
});

argv.plugins && _(argv.plugins).forEach(function(arg){
	arg = arg.split(',');
	arg.forEach(function(arg){
		if (arg == '') return;
		plugins.set(arg,true);
	});
});

argv.no && _(argv.no).forEach(function(arg){
	arg = arg.split(',');
	arg.forEach(function(arg){
		plugins.delete(arg);
	});
});

options.plugins = [];

plugins.forEach(function(value,key,map){
	if (verbose) console.log('requiring ' + key);
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

	console.warn('Unable to find plugin ' + key);
});

var fd = -1;
if (outfile) {
	fd = fs.openSync(outfile, 'w', 0666);
}

if (argv._.length) {
	argv._.forEach(function(infile){
		options.filename = infile;
		//var code = fs.readFileSync(infile);
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
	fs.closeSync(fd);
	process.exit(0);
}

// read from stdin....
var code = '';
process.stdin.setEncoding("utf8");

process.stdin.on("readable", function () {
	var chunk = process.stdin.read();
	if (chunk !== null) code += chunk;
});

process.stdin.on("end", function () {

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


