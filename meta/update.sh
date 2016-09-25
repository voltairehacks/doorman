#! /bin/sh

pi=office

cd webapp
webpack --config webpack.config.js

cd ..
scp -r server/dist/* $pi:doorman/dist/
