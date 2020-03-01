const socket = io();

// server(emits) -> client(receives) --ack--> server
// client(emits) -> server(receives) --ack--> client

// Elements
const $messageForm = document.querySelector('#msg-form');
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $location = document.querySelector('#location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplateLeft = document.querySelector('#message-template-left').innerHTML
const messageTemplateright = document.querySelector('#message-template-right').innerHTML
const locationMsgTemplate = document.querySelector('#locmsg-template').innerHTML
const locationMsgTemplateRight = document.querySelector('#locmsg-template-right').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
	// New Message Element
	const $newMessage = $messages.lastElementChild

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
	
	// Visible Height
	const visibleHeight = $messages.offsetHeight

	// Height of the messages container
	const containerHeight = $messages.scrollHeight

	// How far have I scrolled
	const scrollOffset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
	
}

socket.on('message', (msg) => {
	let html = undefined;
	if(msg.pos){
		html = Mustache.render(messageTemplateright, {
			username:msg.username,
			message: msg.text,
			createdAt: moment(msg.createdAt).format('h:mm A')
		})
	}
	else{	
		html = Mustache.render(messageTemplateLeft, {
			username:msg.username,
			message: msg.text,
			createdAt: moment(msg.createdAt).format('h:mm A')
		})
	}	
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('locationMessage', (locationURL) => {
	let html;
	if(locationURL.pos){
		html = Mustache.render(locationMsgTemplateRight, {
			user:locationURL.username,
			url:locationURL.text,
			createdAt: moment(locationURL.createdAt).format('h:mm A')
		})
	}	
	else{
		html = Mustache.render(locationMsgTemplate, {
		user:locationURL.username,
		url:locationURL.text,
		createdAt: moment(locationURL.createdAt).format('h:mm A')
		})
	}	
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('roomData',({ room, users}) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	})
	document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
	e.preventDefault();

	//Disable the send button
	$messageFormButton.setAttribute('disabled', 'disabled')
	const message = e.target.elements.message.value;
	socket.emit('sendMessage', message, () => {
		//Enable the Button
		$messageFormButton.removeAttribute('disabled')
		//Clear the input value
		$messageFormInput.value = ''
		//Set the focus on input
		$messageFormInput.focus()
		console.log('Message was delivered');
	});
})

$location.addEventListener('click', () => {
	
	if (!navigator.geolocation)
		return alert('Geolocation is not supported by your Browser.')

	//Disable the Share Location Button
		$location.setAttribute('disabled', 'disabled')

	navigator.geolocation.getCurrentPosition( (position) => {
		socket.emit('sendLocation',
			{ lat: position.coords.latitude,
			  long:position.coords.longitude 
			}, () => {
				//Enable the Location Button
				$location.removeAttribute('disabled')
				console.log("Location Shared!")
			});
	})
})

socket.emit('join', { username, room }, (error) => {
	if (error){
		alert(error)
		location.href = '/'
	}
})