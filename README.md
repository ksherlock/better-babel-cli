babelx
------

The babel 6 cli is pretty much useless.  They "encourage" you to install it 
locally for every project.  Meaning it's pretty much broken if you install 
it globally.

Did I mention a local install of babel-cli and nothing else takes up
39 Megabytes?  And that doesn't even include any of the plugins that
actually make babel useful.  Why is that acceptable to anyone?

Anyhow, this is a replacement which includes all the plugins, is global happy,
and somehow only takes up 20 Megabytes (which is still excessive but that's
node for you.)

You can either run it on the command line or put it in your makefile.

    tmp/%.js : jsx/%.jsx
        babelx --react --es2015 -o $@ $< 

Use `--preset` or `--plugin` to enable transformations.  You can also
use `--no-plugin` to disable a plugin (if it was part of a preset, for
example.)

run `babelx --help` to see a list of presets and plugins.
