"use strict";

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


var extra_arg = function(dash, opt, arg) {
	var e = new Error(`option ${dash}${opt} does not have an argument.`);
	e.option = dash + opt;
	e.argument = arg;
	return e;
}

var missing_arg = function(dash, opt) {
	var e = new Error(`option ${dash}${opt} requires an argument.`);
	e.option = dash + opt;
	return e;
}

var invalid_option = function(dash, opt) {
	var e = new Error(`invalid option ${dash}${opt}.`);
	e.option = dash + opt;
	return e;
}


const BAD_ARG = ':';
const BAD_CH = '?';
const INORDER = 1;

/*
const POSIXLY_CORRECT = false;
const FLAG_ALLARGS = false;
const FLAG_LONGONLY = false;
const FLAG_SHORTONLY = false;
const FLAG_W = false;
*/

var split_opt_string = function(so, config) {
	/* convert a short-opt string into a map */
	// leading + --> disable permutation (stop at first non-arg)
	// leading - --> FLAG_ALLARGS

	var options = new Map();

	if (!so) return options;

	var i = 0;
	var l = so.length;
	switch (so.charAt(0)) {
		case '+':
			config.POSIXLY_CORRECT = true;
			++i;
			break;
		case '-':
			config.FLAG_ALLARGS = true;
			++i;
			break;
	}

	while (i < l) {
		var c = so.charAt(i++);
		var mod = so.charAt(i);
		if (mod == ':') {
			options.set(c, mod);
			++i;
			continue;
		}
		if (mod == ';' && c == 'W') {
			// W; means -W foo == --foo
			config.FLAG_W = true;
			++i;
			continue;
		}
		options.set(c, true);
	}
	return options;
}

var split_opt_array = function(optarray, config) {


	var options = new Map();

	//remap optargs array.
	(optarray || []).forEach(function(opt){
		var m;
		var modifier = true;
		if (m = opt.match(/^([^:=!]+)(!|[:=][si])$/)) {

			opt = m[1];
			modifier = m[2];
			if (modifier == '!') {
				options.set('no-' + opt, '!!')
			}
		}
		options.set(opt, modifier);
	});

	return options;
}

module.exports.getopt = function(argv, optstring, callback) {
	var config = {
		FLAG_SHORTONLY: true
	};

	var so = split_opt_string(optstring, config);

	return getopt_common(argv, so, null, callback, config);
}

module.exports.getopt_long = function(argv, optstring, optarray, callback) {
	var config = {};

	var so = split_opt_string(optstring, config);
	var lo = split_opt_array(optarray, config);

	return getopt_common(argv, so, lo, callback, config);
}

module.exports.getopt_long_only = function(argv, optarray, callback) {
	var config = {
		FLAG_LONGONLY: true
	};

	var lo = split_opt_array(optarray, config);

	return getopt_common(argv, null, lo, callback, config);
}


// returns state.
var parse_long_opt = function (arg, long_opts, callback, config) {
	const FLAG_ALLARGS = config.FLAG_ALLARGS;

	var m;
	var optarg;
	var modifier;

	arg = arg.substr(2);
	if (m = arg.match(/^([^=]+)=(.*)$/)) {
		arg = m[1];
		optarg = m[2];

		// handle it here to simplify argument checks.
		modifier = long_opts.get(arg);
		switch(modifier) {
			case undefined:
				if (FLAG_ALLARGS) callback(INORDER, arg)
				callback(BAD_CH, invalid_option('--', arg));
				return null;
			case '!':
			case true:
				callback(BAD_ARG, extra_arg('--', arg, optarg));
				return null;
			default:
				callback(arg, optarg);
				return null;
		}
	}

	modifier = long_opts.get(arg);
	switch(modifier) {
		case undefined: break; // try again as no- below.
		case true:
			callback(arg);
			return null;

		case '!!':
			// --no-arg => arg
			callback(arg.substr(3), false);
			return null;

		case '!':
			callback(arg, true);
			return null;

		default:
			return ['--', arg, modifier];
	}

	if (FLAG_ALLARGS) callback(INORDER, arg);
	else callback(BAD_CH, invalid_option('--', arg));
	return null;
} 

var getopt_common = function(argv, short_opts, long_opts, callback, config) {

	const FLAG_SHORTONLY = config.FLAG_SHORTONLY || false;
	const FLAG_LONGONLY = config.FLAG_LONGONLY || false;
	const FLAG_ALLARGS = config.FLAG_ALLARGS || false;
	const FLAG_W = config.FLAG_W || false;
	const POSIXLY_CORRECT = config.POSIXLY_CORRECT || false;

	if (!callback) callback = function(){};
	if (!config) config = {};

	var state = null;
	var __ = false;

	if (!argv) argv = process.argv.slice(2);
	var rv = argv.filter(function(arg){

		var m;
		var optarg;
		var modifier;
		var opt;

		if (__) return true;

		if (state === '-W') {
			state = parse_long_opt('--' + arg, long_opts, callback, config);
			return false;
		}

		if (state) {
			// arg for previous flag!
			if (state[2].charAt(0) == '=' || arg.charAt(0) != '-') {

				callback(state[1], arg);
				state = null;
				return false;
			}

			if (state[2].charAt(0) == ':') {
				// optional arg w/o an option.
				callback(state[1], '');
			}
			state = null;
		}

		if (arg.substr(0,2) == '--' && !FLAG_SHORTONLY) {
			state = parse_long_opt(arg, long_opts, callback, config);
			return false;
		}

		if (arg.charAt(0) == '-' && !FLAG_LONGONLY) {
			for (var i = 1, l = arg.length; i < l; ++i) {
				opt = arg.charAt(i);
				modifier = short_opts.get(opt);
				switch(modifier) {
					case undefined:
						// -W flag?
						if (opt == 'W' && FLAG_W && !FLAG_SHORTONLY) {
							state = '-W';
							break;
						}
						if (FLAG_ALLARGS) callback(INORDER, opt);
						else callback(BAD_CH, invalid_option('-', opt));
						continue;
					case true:
						callback(opt);
						continue;
					case '!':
						callback(opt, true);
						continue;
					default:
						state = ['-', opt, modifier];
						break;
				}
				// only here if : or =.
				break;
			}

			if (state && ++i < l) {
				optarg = arg.substr(i);
				if (state === '-W') {
					state = parse_long_opt('--' + optarg, long_opts, callback, config);
				}
				else {
					opt = state[1];
					callback(opt, optarg);
					state = null;
				}
			}

			return false;
		}


		// not an option; add it to the list.
		if (POSIXLY_CORRECT) __ = true;
		return true;

	});

	if (state){
		if (state[2].charAt(0) == ':') {
			callback(state[1], '');
		}
		else {
			callback(BAD_ARG, missing_arg(state[0], state[1]));
		}
	}

	return rv;
}
