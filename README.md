# Better Babel CLI

The babel 6 cli is actively user hostile.  They "encourage" you to install it 
locally for every project.  Installing it globally is a waste of time.

Did I mention a local install of babel-cli and nothing else takes up
39 Megabytes?  And that doesn't even include any of the plugins that
actually make babel useful.  Why is that acceptable to anyone?

This is a replacement which includes all the plugins, is global happy,
works great on the command-line and in makefiles, doesn't require `.babelrc`
files to configure, and somehow only takes up 20 Megabytes (which is still 
excessive but that's node for you.)

## Install

    [sudo] npm uninstall -g babel-cli
    [sudo] npm install -g better-babel-cli

## Example

You can either run it on the command line or put it in your makefile.

### Makefile:

    out/%.js : src/%.jsx
        babel --react --es2015 --object-rest-spread -o $@ $< 

    out/%.js : src/%.js
        babel --es2015 -o $@ $< 


### Commandline:

    babel --verbose --es2015 --stage-0
    (reads stdin, writes to stdout)


Use `--preset` or `--plugin` to enable transformations.  You can also
use `--no-plugin` to disable a plugin (if it was part of a preset, for
example.).  `--foo` and `--transform-foo` are equivalent to 
`require(babel-plugin-transform-foo)`.

run `babel --help` to see a list of presets and plugins.
