const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath))

//server (emits) -> client (receives) - countUpdted
//client (emits) -> server (receives) - increment

io.on('connection', (socket) => {
	console.log('New WebSocket Connection')

	//When a new user joins
	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({ id:socket.id, username, room })
	// socket.on('join', (options, callback) => {
	// 	const { error, user } = addUser({ id:socket.id, ...options })	
		if(error){
			return callback(error)
		}
		socket.join(user.room)
		//To emit message to the new user who joined
		socket.emit('message', generateMessage('Admin', 'Welcome!'))
		//To emit message to all the connected users in this room except the new user who just joined
		socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
		//Send the users list in the current room
		io.to(user.room).emit('roomData', {
			room:user.room,
			users:getUsersInRoom(user.room)
		})
		//Send ack to the client that they have joined successfully
		callback()
		
	})
	
	//To listen to an event
	socket.on('sendMessage', (msg, callback) => {
		//get details of the current user
		const user = getUser(socket.id)
		//To emit the message to all the users connected to a particular room
		io.to(user.room).emit('message', generateMessage(user.username, msg))
		callback();
	})

	//When a user has left
	socket.on('disconnect', () => {
		const user = removeUser(socket.id)
		if(user) {
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
			io.to(user.room).emit('roomData', {
				room:user.room,
				users:getUsersInRoom(user.room)
			})
		}
		
	})

	socket.on('sendLocation', (location, callback) => {
		//get details of the current user
		const user = getUser(socket.id)
		//console.log(`Location: ${location.long}, ${location.lat}`);
		io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.lat},${location.long}`))
		callback();
	})

})

server.listen(port, () => {
	console.log(`Server is up and running on port ${port}`);
})