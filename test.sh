#!/usr/bin/sh

node -c babel.js || exit 1;
node -c getopt.js || exit 1;
node -c getsubopt.js || exit 1;
node -c data.js || exit 1;
node test_data.js || exit 1

echo "let x = 1; const y = 2;" | node babel.js --es2015 > /dev/null;

