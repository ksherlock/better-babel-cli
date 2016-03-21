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


/*
 * Instead of trying to decide among the 100+ half-assed node getopt replacements,
 * I wrote my own half-assed getopt replacement.
 *
 */

/*
 * options is an hash table of, well, options. 
 * eg {'-o': String, '-h': true, '--bleh': Boolean}
 */

var check_opt = function(options, arg) {
	var x = options[arg];
	if (x) return x;
	if (options.hasOwnProperty(arg)) return true;
	return false;
}

var check_inverted = function(options, arg) {
	var m,x;
	if (m = arg.match(/^--no-(.*)$/)) {
		var x = `--${m[1]}`;
		if (check_opt(options, x) == Boolean) return x;
	}
	return false;
}

module.exports = function(argv, options, callback) {

	options = options || {};

	var rv = [];
	var __ = false;
	var state = 0;

	rv = argv.filter(function(arg){

		var t, tt, e;

		if (__) return true;


		if (state) {
			// argument option!
			callback(state, arg);
			state = 0;
			return false;
		}

		if (arg == '--') {
			__ = true;
			return false;
		}

		if (arg.substr(0,2) == '--') {
			// long opt.
			var m;
			if (m = arg.match(/^([^=]+)=(.*)$/)) {
				arg = m[1];
				t = check_opt(options, arg);

				if (t == String) {
					callback(arg, m[2]);
					return false;
				}

				if (t) e = new Error(`option ${arg} doesn't take an argument`); // '
				else e = new Error(`unrecognized option ${arg}`);
				e.option = arg;
				callback('?', undefined, e);
				return false;
			}

			t = check_opt(options, arg);
			if (t == String) {
				state = arg;
				return false;
			}
			if (t == Boolean) {
				callback(arg, true);
				return false;
			}
			if (t) {
				callback(arg, true);
				return false;
			}

			if (tt = check_inverted(options, arg)) {
				callback(tt, false);
				return false;
			}

			e = new Error(`unrecognized option: ${arg}`);
			e.option = arg;
			callback('?', undefined, e);
			return false;
		}

		if (arg.substr(0,1) == '-') {
			// short opt.
			var i = 1;
			var l = arg.length;
			while (i < l) {
				var o = '-' + arg.charAt(i++);
				t = check_opt(options, o);
				if (t == String) {
					state = o;
					break;
				}
				callback(o, true);
			}
			if (i < l) {
				callback(state, arg.substr(i,l));
				state = 0;
			}
			return false;
		}
		return true;

	});

	if (state) {
		var e = new Error(`option ${state} requires an argument`);
		e.option = state;
		callback(':', undefined, e);
	}

	return rv;

};
