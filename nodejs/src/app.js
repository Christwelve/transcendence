const http = require('http');
const express = require('express');
const {Server: WebSocketServer} = require('socket.io');
const app = express();
const server = http.createServer(app);

const io = new WebSocketServer(server, {
	serveClient: false,
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
		// allowedHeaders: ['my-custom-header'],
		credentials: true
	}
});

const port = 4000;

server.listen(port, () => {
	console.log(`Nodejs listening at http://localhost:${port}`);
});

io.on('connection', socket => {
	console.log('user connected');
});
