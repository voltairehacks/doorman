#! /bin/sh

pi=office

cd webapp
webpack --config webpack.config.js

cd ..
scp -r server $pi:doorman
scp service $pi:/etc/init.d/doorman

ssh $pi -c 'sudo update-rc.d /etc/init.d/doorman defaults'
