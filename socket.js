let app = require('express')(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    port = process.env.PORT || 3000,
    users = {};

server.listen(port);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})
io.on('connection', socket => {
    socket.on('new-user', name => {
        users[socket.id] = name;
        console.log(users);
        socket.broadcast.emit('user-joined', `${name} joined`);
    })
    socket.on('disconnect', () => {
        socket.broadcast.emit('user-left', `${users[socket.id]} left the chat`)
    })
    socket.on('chat', message => {
        socket.broadcast.emit('input', `${users[socket.id]}: ${message}`)
    })
})