var io;

function createSocketIO(http){
	io = require('socket.io')(http);
	io.on('connection', function (socket) {
		//console.log("a user connected"); 
		socket.on('disconnect', function(){});
		socket.on('message', function (data) {
			io.emit('message', data);
		});
		// once a client has connected, we expect to get a ping from them saying what room they want to join
	    socket.on('room', function(room) {
	    	if(room!=undefined && room !=null){
	        	socket.join(room);
	    	}
	    });
	    socket.on('leaveRoom',function(room){
	    	if(room!=undefined && room !=null){
		    	socket.leave(room);
	    	}
	    });
	});
}
exports.createSocketIO=createSocketIO;
function getSocketIO(){
	return io;
}
exports.getSocketIO=getSocketIO;

function alertRoom(room,data){
	// now, it's easy to send a message to just the clients in a given room
	var dataToSend='Something Updated';
	if(data){
		dataToSend=data;
	}
	io.sockets.in(room).emit(room, dataToSend);
}
exports.alertRoom=alertRoom;