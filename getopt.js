
/*
 * Instead of trying to decide among the 100+ half-assed node getopt replacements,
 * I wrote my own half-assed getopt replacement.
 *
 */
module.exports = function(argv, options, callback) {

	options = options || {};
	var shortargs = options.shortargs || ''; // short arguments that require an option (:)

	var rv = [];
	var __ = false;
	var state = 0;

	rv = argv.filter(function(arg){

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
				callback(m[1],m[2]);
				return false;
			}

			callback(arg);
			return false;
		}

		if (arg.substr(0,1) == '-') {
			// short opt.
			var i = 1;
			var l = arg.length;
			while (i < l) {
				var o = arg.charAt(i++);
				if (!!~shortargs.indexOf(o)){
					state = '-' + o;
					break;
				}
				callback('-' + o);
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
		callback(state, undefined);
		//console.log(`Error: ${state} requires an option.`);
	}

	return rv;

};
