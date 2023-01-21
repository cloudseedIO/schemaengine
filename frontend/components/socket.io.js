var endPoints=require('../endPoints.js');
var endPoint=endPoints.apiServerAddress || "https://localhost:9500";

var socket={};
try{
	socket = require('socket.io-client')(endPoint);
}catch(err){
	
}
exports.socket=socket;

function createRoom(room){
	socket.emit('room', room);
}
exports.createRoom=createRoom;

function leaveRoom(room){
	socket.emit('leaveRoom', room);
}
exports.leaveRoom=leaveRoom;
