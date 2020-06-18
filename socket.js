let app = require("express")(),
  server = require("http").Server(app),
  io = require("socket.io")(server),
  port = process.env.PORT || 3000,
  rooms = [
    {
      name: "Dev Room",
      users: {},
    },
  ],
  log = { users: [], rooms: [] };

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

//get log
app.get("/log", (req, res) => res.send(log));

// get all rooms
app.get("/rooms", (req, res) => res.send(rooms));

// get room details
app.get("/room/:name", (req, res) =>
  res.send(rooms.filter((r) => r.name === req.params.name))
);

// socket connection
io.on("connection", (socket) => {
  // on incoming message
  socket.on("chat-message", ({ msg, room, user }) => {
    socket.to(room).broadcast.emit("incomingMessage", {
      text: msg,
      name: user,
      id: Math.random(),
      timeStamp: new Date(),
      isMsg: true,
    });
  });

  // create group
  socket.on("create-group", (name) => {
    if (!rooms.some((r) => r.name === name))
      rooms.push({
        name,
        users: {},
      });
  });

  // join the group
  socket.on("join-group", (room, name) => {
    // log
    log.users.push(name);
    log.rooms.push(room);

    // if room not available
    let noRoom = addUser({
      room,
      id: socket.id,
      name,
    });
    if (!noRoom)
      socket.join(room, () =>
        socket
          .to(room)
          .broadcast.emit(
            "notification",
            `${getUserRoom(socket.id).user} joined`
          )
      );
  });

  //leave group
  socket.on("leave-group", (room) =>
    socket.leave(room, () => {
      socket
        .to(room)
        .broadcast.emit("notification", `${getUserRoom(socket.id).user} left`);
      removeUser({ id: socket.id });
    })
  );

  socket.on("disconnect", () => {
    if (!rooms.length) return;
    let userRoom = getUserRoom(socket.id);
    if (userRoom) {
      removeUser({ id: socket.id });
      socket.leave(userRoom.room, () =>
        socket
          .to(userRoom.room)
          .broadcast.emit("notification", `${userRoom.user} left`)
      );
    }
  });
});

const getUserRoom = (id) => {
  for (let i = 0; i < rooms.length; i++) {
    const users = rooms[i].users;
    if (Object.keys(users).indexOf(id) > -1)
      return { user: users[id], id, room: rooms[i].name };
  }
};

const addUser = ({ room, id, name }) => {
  let fRoom = rooms.filter((r) => r.name === room)[0];
  if (fRoom) fRoom.users[id] = name;
  else return true;
};

const removeUser = ({ id }) => {
  let filRoom = rooms.filter((r) => Object.keys(r.users).indexOf(id) > -1);
  if (filRoom.length) delete filRoom[0].users[id];
};
