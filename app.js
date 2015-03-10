//Setup basic express/node server
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

server.listen(process.env.PORT || 8000);

//Express routing
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

//what to do on connection
io.sockets.on('connection', function(socket){
	var addedUser = false;

	//listens for client emiting 'add user', then executes
	socket.on('add user', function(username){
		//store the username in the socket session
		//for this client
		socket.username = username;
		//add the client's username to the global list
		usernames[username] = username;
		++numUsers;
		addedUser = true;
		//emits to client the num of users
		io.sockets.emit('login', {
			numUsers: numUsers
		});
		console.log("A new user! " + socket.username);
		console.log("There are %d users live", numUsers);
	});

	  // when the client emits 'typing', we broadcast it to others
	socket.on('typing', function () {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function () {
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});

	//when client emits his location, need to set it to their socket
	socket.on('send location', function(data){
		socket.location = data.position;
		socket.exactPosition = data.namedLocation;

		console.log("recieved location " + socket.location.coords.latitude + ", "
		 + socket.location.coords.longitude);
		console.log("recieved a position: " + socket.exactPosition);

	});

	console.log('working');

	socket.on('send msg', function(data){
		//sending each users position along with skeleton data
		io.sockets.emit('get msg', {
			user: socket.username,
			message: data,
			position: socket.location,
			exactPosition: socket.exactPosition,
			map: { 
				center: { 
					latitude: '',
					longitude: ''
				},
				zoom: 12
			},
			marker: {
				coords: {
					latitude: '',
					longitude: ''
				}
			}
		});
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function () {
		// remove the username from global usernames list
		if (addedUser) {
			delete usernames[socket.username];
			--numUsers;

			// echo globally that this client has left
			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
})
