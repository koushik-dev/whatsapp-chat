let app = require("express")(),
  server = require("http").Server(app),
  io = require("socket.io")(server),
  port = process.env.PORT || 3000,
  rooms = {};

server.listen(port);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
io.on("connection", (socket) => {
  socket.emit("rooms", Object.keys(rooms));
  socket.on("addRoom", (name) => {
    socket.join(name);
    if (!rooms[name])
      rooms[name] = {
        users: {},
      };
    socket.on("new-user", (uname) => {
      rooms[name].users[socket.id] = uname;
      socket.to(name).broadcast.emit("user-joined", `${uname} joined`);
    });
  });
  socket.on("disconnect", () => {
    if (!Object.keys(rooms).length) return;
    let userRoom = getUserRoom(socket.id);
    if (userRoom)
      socket.leave(userRoom.room, () =>
        socket
          .to(userRoom.room)
          .broadcast.emit("user-left", `${userRoom.user} left the chat`)
      );
  });
  socket.on("chat", (message) => {
    if (!Object.keys(rooms).length) return;
    let { user, room } = getUserRoom(socket.id);
    socket.to(room).broadcast.emit("input", `${user}: ${message}`);
  });
});

const getUserRoom = (id) => {
  for (const room in rooms) {
    if (rooms.hasOwnProperty(room)) {
      const users = rooms[room].users;
      if (Object.keys(users).indexOf(id) > -1)
        return { user: users[id], id, room };
    }
  }
};
