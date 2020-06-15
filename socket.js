let app = require("express")(),
  server = require("http").Server(app),
  io = require("socket.io")(server),
  port = process.env.PORT || 3000,
  rooms = [];

server.listen(port);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.get("/", (req, res) => {
  res.send("");
});
app.get("/rooms", (req, res) => {
  res.send(rooms);
});
app.get("/room/:name", (req, res) => {
  res.send(rooms.filter((r) => r.name === req.params.name));
});
io.on("connection", (socket) => {
  socket.on("chat-message", (msg) => {
    socket.broadcast.emit("incomingMessage", {
      text: msg,
      name: "Jane Doe",
      id: Math.random(),
      timeStamp: new Date(),
    });
  });
  socket.on("add-group", (name) => {
    socket.join(name);
    if (!rooms.some((r) => r.name === name))
      rooms.push({
        name,
        users: {},
      });
    console.log(rooms);
  });
  socket.on("new-user", (uname) => {
    rooms[name].users[socket.id] = uname;
    socket.to(name).broadcast.emit("user-joined", `${uname} joined`);
  });
  socket.on("disconnect", () => {
    if (!rooms.length) return;
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
  for (let i = 0; i < rooms.length; i++) {
    const users = rooms[i].users;
    if (Object.keys(users).indexOf(id) > -1)
      return { user: users[id], id, room };
  }
};
