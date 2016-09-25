#! /bin/sh

pi=office

cd ..

cd webapp
webpack --config webpack.config.js

cd ..
ssh $pi 'mkdir -p doorman'
scp -r server/main.py server/dist server/requirements.txt meta/service $pi:doorman

ssh $pi 'sudo cp $HOME/doorman/service /etc/init.d/doorman \
  && sudo pip install -r $HOME/doorman/requirements.txt \
  && sudo chmod +x /etc/init.d/doorman \
  && sudo apt-get install -y nmap \
  && sudo update-rc.d doorman defaults'
