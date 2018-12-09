"use strict";

exports.plugins = new Set([
	'external-helpers',

	/* syntax only */
	'syntax-async-generators',
	'syntax-bigint',
	'syntax-class-properties',
	'syntax-decorators',
	'syntax-do-expressions',
	'syntax-dynamic-import',
	'syntax-export-default-from',
	'syntax-export-extensions',
	'syntax-export-namespace-from',
	'syntax-flow',
	'syntax-function-bind',
	'syntax-function-sent',
	'syntax-import-meta',
	'syntax-json-strings',
	'syntax-jsx',
	'syntax-logical-assignment-operators',
	'syntax-nullish-coalescing-operator',
	'syntax-numeric-separator',
	'syntax-optional-catch-binding',
	'syntax-optional-chaining',
	'syntax-pipeline-operator',
	'syntax-throw-expressions',
	'syntax-typescript',


	'transform-arrow-functions',
	'transform-async-to-generator',
	'transform-block-scoped-functions',
	'transform-block-scoping',
	'transform-classes',
	'transform-computed-properties',
	'transform-destructuring',
	'transform-dotall-regex',
	'transform-duplicate-keys',
	'transform-exponentiation-operator',
	'transform-flow-comments',
	'transform-flow-strip-types',
	'transform-for-of',
	'transform-function-name',
	'transform-instanceof',
	'transform-jscript',
	'transform-literals',
	'transform-member-expression-literals',
	'transform-modules-amd',
	'transform-modules-commonjs',
	'transform-modules-systemjs',
	'transform-modules-umd',
	'transform-new-target',
	'transform-object-assign',
	'transform-object-set-prototype-of-to-assign',
	'transform-object-super',
	'transform-parameters',
	'transform-property-literals',
	'transform-property-mutators',
	'transform-proto-to-assign',
	'transform-react-constant-elements',
	'transform-react-display-name',
	'transform-react-inline-elements',
	'transform-react-jsx',
	'transform-react-jsx-compat',
	'transform-react-jsx-self',
	'transform-react-jsx-source',
	'transform-regenerator',
	'transform-reserved-words',
	'transform-runtime',
	'transform-shorthand-properties',
	'transform-spread',
	'transform-sticky-regex',
	'transform-strict-mode',
	'transform-template-literals',
	'transform-typeof-symbol',
	'transform-typescript',
	'transform-unicode-regex',


	/* proposals */
	'proposal-async-generator-functions',
	'proposal-class-properties',
	'proposal-decorators',
	'proposal-do-expressions',
	'proposal-export-default-from',
	'proposal-export-namespace-from',
	'proposal-function-bind',
	'proposal-function-sent',
	'proposal-json-strings',
	'proposal-logical-assignment-operators',
	'proposal-nullish-coalescing-operator',
	'proposal-numeric-separator',
	'proposal-object-rest-spread',
	'proposal-optional-catch-binding',
	'proposal-optional-chaining',
	'proposal-pipeline-operator',
	'proposal-private-methods',
	'proposal-throw-expressions',
	'proposal-unicode-property-regex',


	// babili
	'minify-builtins',
	'minify-constant-folding',
	'minify-dead-code-elimination',
	'minify-flip-comparisons',
	'minify-guarded-expressions',
	'minify-infinity',
	'minify-mangle-names',
	'minify-numeric-literals',
	'minify-replace',
	'minify-simplify',
	'minify-type-constructors',
	'transform-inline-consecutive-adds',
	'transform-inline-environment-variables',
	'transform-member-expression-literals',
	'transform-merge-sibling-variables',
	'transform-minify-booleans',
	'transform-node-env-inline',
	'transform-property-literals',
	'transform-regexp-constructors',
	'transform-remove-console',
	'transform-remove-debugger',
	'transform-remove-undefined',
	'transform-simplify-comparison-operators',
	'transform-undefined-to-void',


	// 3rd party
	'inferno',
	'lodash',
	'mjsx',
	'transform-symbol-member',
	'transform-vue-jsx',
]);

exports.presets = new Map([
	['react', [
	'syntax-jsx',
	'transform-react-jsx',
	'transform-react-display-name',
	]],

	['react-development', [
	'syntax-jsx',
	'transform-react-jsx',
	'transform-react-display-name',
	'transform-react-jsx-self',
	'transform-react-jsx-source',
	]],

	// https://github.com/facebook/react-native/tree/master/babel-preset
	// https://github.com/facebook/metro/blob/master/babel.config.js
	['react-native', [
    'proposal-object-rest-spread',
    'transform-async-to-generator',
    'transform-destructuring',
    'transform-flow-strip-types',
    'syntax-dynamic-import',

    // TODO: Check if plugins from the list below are actually in use
    'proposal-class-properties',
    'transform-modules-commonjs',
    'transform-parameters',
    'transform-react-jsx',
    'transform-spread',
	]],

	['es2015', [
	'transform-template-literals',
	'transform-literals',
	'transform-function-name',
	'transform-arrow-functions',
	'transform-block-scoped-functions',
	'transform-classes',
	'transform-object-super',
	'transform-shorthand-properties',
	'transform-duplicate-keys',
	'transform-computed-properties',
	'transform-for-of',
	'transform-sticky-regex',
	'transform-unicode-regex',
	'transform-spread',
	'transform-parameters',
	'transform-destructuring',
	'transform-block-scoping',
	'transform-typeof-symbol',
	['transform-regenerator', { async: false, asyncGenerators: false }],
	]],

	// as above but add helpers, remove common-js
	['es2015-rollup', [
	'transform-template-literals',
	'transform-literals',
	'transform-function-name',
	'transform-arrow-functions',
	'transform-block-scoped-functions',
	'transform-classes',
	'transform-object-super',
	'transform-shorthand-properties',
	'transform-duplicate-keys',
	'transform-computed-properties',
	'transform-for-of',
	'transform-sticky-regex',
	'transform-unicode-regex',
	'transform-spread',
	'transform-parameters',
	'transform-destructuring',
	'transform-block-scoping',
	'transform-typeof-symbol',
	['transform-regenerator', { async: false, asyncGenerators: false }],
	'external-helpers',
	]],

	['es2016', [
	'transform-exponentiation-operator',
	]],

	['es2017', [
	'transform-async-to-generator',
	]],

	// latest is es2015, es2106, es2017.
	// (todo -- babel latest has options to include/exclude each)
	['latest', [
	// es 2015
	'transform-template-literals',
	'transform-literals',
	'transform-function-name',
	'transform-arrow-functions',
	'transform-block-scoped-functions',
	'transform-classes',
	'transform-object-super',
	'transform-shorthand-properties',
	'transform-duplicate-keys',
	'transform-computed-properties',
	'transform-for-of',
	'transform-sticky-regex',
	'transform-unicode-regex',
	'transform-spread',
	'transform-parameters',
	'transform-destructuring',
	'transform-block-scoping',
	'transform-typeof-symbol',
	['transform-regenerator', { async: false, asyncGenerators: false }],

	// es 2016
	'transform-exponentiation-operator',

	// es 2017
	'transform-async-to-generator',
	]],


	['stage-3', [
	'transform-async-to-generator',
	'transform-exponentiation-operator',
	'proposal-async-generator-functions',
	'proposal-object-rest-spread',
	]],

	['stage-2', [
	'transform-async-to-generator',
	'transform-exponentiation-operator',
	'proposal-async-generator-functions',
	'proposal-object-rest-spread',

	'syntax-dynamic-import',
	'proposal-class-properties',
	['proposal-decorators', {legacy: true}],
	]],

	['stage-1', [
	'transform-async-to-generator',
	'transform-exponentiation-operator',
	'proposal-async-generator-functions',
	'proposal-object-rest-spread',

	'syntax-dynamic-import',
	'proposal-class-properties',
	['proposal-decorators', {legacy: true}],


	'transform-class-constructor-call',
	'transform-export-extensions',
	]],

	['stage-0', [
	'transform-async-to-generator',
	'transform-exponentiation-operator',
	'proposal-async-generator-functions',
	'proposal-object-rest-spread',

	'syntax-dynamic-import',
	'proposal-class-properties',
	['proposal-decorators', {legacy: true}],

	'transform-class-constructor-call',
	'transform-export-extensions',

	'proposal-do-expressions',
	'proposal-function-bind',
	]],


	['flow', [
	'transform-flow-strip-types',
	]],

	['typescript', [
	'transform-typescript',
	]],

	['babili',[
	'minify-builtins',
	'minify-constant-folding',
	'minify-dead-code-elimination',
	'minify-flip-comparisons',
	'minify-guarded-expressions',
	'minify-infinity',
	'minify-mangle-names',
	'minify-numeric-literals',
	'minify-replace',
	'minify-simplify',
	'minify-type-constructors',
	'transform-inline-consecutive-adds',
	'transform-member-expression-literals',
	'transform-merge-sibling-variables',
	'transform-minify-booleans',
	'transform-property-literals',
	'transform-regexp-constructors',
	'transform-remove-console',
	'transform-remove-debugger',
	'transform-remove-undefined',
	'transform-simplify-comparison-operators',
	'transform-undefined-to-void',
	]],

	['vue', [
	'transform-vue-jsx',
	]]
]);

function _(o) {
	var x = Object.keys(o).map(function(k){
		return [k, o[k]];
	});

	return new Map(x)
}

exports.config = new Map([
	['transform-async-to-module-method', {module: String, method: String}],
	['transform-arrow-functions', {spec: Boolean}],
	['transform-block-scoping', {throwIfClosureRequired: Boolean, tdz: Boolean}],
	['transform-classes', {loose: Boolean}],
	['transform-computed-properties', {loose: Boolean}],
	['transform-destructuring', {loose: Boolean}],
	['transform-for-of', {loose: Boolean}],
	['transform-modules-amd', {allowTopLevelThis: Boolean, loose: Boolean, strict: Boolean, strictMode: Boolean}],
	['transform-modules-commonjs', {allowTopLevelThis: Boolean, loose: Boolean, noInterop: Boolean, strict: Boolean, strictMode: Boolean}],
	['transform-modules-systemjs', {loose: Boolean, systemGlobal: String}],
	['transform-modules-umd', {globals: Object, exactGlobals: Boolean, allowTopLevelThis: Boolean, loose: Boolean, strict: Boolean, strictMode: Boolean }],
	['transform-spread', {loose: Boolean}],
	['transform-template-literals', {loose: Boolean, spec: Boolean}],
	['transform-inline-environment-variables', {include: Array, exclude: Array}],
	['proposal-object-rest-spread', {useBuiltIns: Boolean, loose: Boolean}],
	['transform-react-jsx', {pragma: String, pragmaFrag: String, throwIfNamespace: Boolean, useBuiltIns: Boolean}],
	['transform-regenerator', {asyncGenerators: Boolean, generators: Boolean, async: Boolean}],
	['transform-remove-console', {exclude: Array}],
	['transform-runtime', {absoluteRuntime: String, corejs: Boolean, helpers: Boolean, regenerator: Boolean, useESModules: Boolean, version: String}],
	['transform-strict-mode', {strict: Boolean, strictMode: Boolean}],

	['transform-flow-strip-types', {requireDirective: Boolean}],
	['transform-typescript', {isTSX: Boolean, jsxPragma: String}],
	['syntax-typescript', {isTSX: Boolean}],

	['proposal-decorators', {decoratorsBeforeExport: Boolean, legacy: Boolean}],

	// babili
	['minify-builtins', {tdz: Boolean}],
	['minify-constant-folding', {tdz: Boolean}],
	['minify-dead-code-elimination', {keepClassName: Boolean, keepFnArgs: Boolean, keepFnName: Boolean, optimizeRawSize: Boolean, tdz: Boolean}],

	// TODO - exclude is a hash of {name => bool}
	['minify-mangle-names', {exclude: Object, eval: Boolean, keepClassName: Boolean, keepFnName: Boolean, topLevel: Boolean}],
	['minify-type-constructors', {array: Boolean, boolean: Boolean, number: Boolean, object: Boolean, string: Boolean}],
	['minify-type-constructors', {array: Boolean, boolean: Boolean, number: Boolean, object: Boolean, string: Boolean}],
	['transform-remove-undefined', {tdz: Boolean}],

	// not yet supported.
	['minify-replace', { replacements: Object}],

	// not in current version.

	// third party.
	['lodash', {id: String, cwd: String}],
	['inferno', {imports: Boolean, pragma: String }],

]);
