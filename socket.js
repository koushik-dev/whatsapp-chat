const port = process.env.PORT || 3000;
const io = require('socket.io')(port)
let users = {};

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