#! /bin/sh
#Killing existing application
echo "Killing existing application"
sudo pkill node

#Moving to root folder
echo "Moving to root folder"
cd /home/ubuntu/wk

#Starting api server
echo "Starting api server"
cd wk_api/
npm install
node app.js > /dev/null 2>&1 &

#Starting Box api server
echo "Starting Box api server"
cd ../box_com_API/ 
npm install
node rest.js > /dev/null 2>&1 &

#Starting Chat server
echo "Starting Chat server"
cd ../chat/
npm install
node  app.js> /dev/null 2>&1 &

#starting Frontend server
echo "starting Frontend server"
cd ../frontend
npm install
NODE_ENV=production browserify ./components/clientCode.js -o ./views/resource/js/bundle.js
node app.js > /dev/null 2>&1 & 

#node messenger.js > /dev/null 2>&1 &

