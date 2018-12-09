
/*
 * make sure all packages can be loaded.
 *
 */
var babel = require('@babel/core');

var data = require('./data');


function can_require(module) {

	try {
		x = `./babel-plugin/${module}.js`;
		y = require(x);
		return true;
	} catch(ex) {}

	try {
		x = `@babel/plugin-${module}`;
		y = require(x);
		return true;
	} catch(ex) {}

	try {
		/* minify not switched to @babel/, yet */
		x = `babel-plugin-${module}`;
		y = require(x);
		return true;		
	} catch(ex) { }

	return false;
}


errors = 0;
data.plugins.forEach(function(module) { 

	var ok = can_require(module);
	if (!ok) console.warn(`require ${module}`);

});


data.presets.forEach(function(v,preset) { 

	v.forEach(function(module) { 

		if (Array.isArray(module)) module = module[0];
		var ok = can_require(module);
		if (!ok) console.warn(`require ${preset} - ${module}`);

	});

});


process.exit(errors == 0 ? 0 : 1);

