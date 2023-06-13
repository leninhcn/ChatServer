const mesproc = require('./DButilities/message_proc.js');
const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http, {
  cors: {
    origin: ["http://localhost:8080", "http://172.23.20.170:8080"],
    methods: ["GET", "POST"]
  }
});

const port = 3001;
app.get('/', (req, res) => {
  res.send("Node Server is running. Yay!!")
})

const getConnectedClientsCount = () => {
  return io.sockets.sockets.size;
};

// Lắng nghe sự kiện kết nối từ các client
io.on('connection', (socket) => {
  console.log(`New user connected: [${socket.handshake.address}], with id [${socket.id}]`);
  console.log('Số lượng client đang kết nối:', getConnectedClientsCount());

  // const rooms = io.sockets.adapter.rooms;
  // const roomList = Array.from(rooms.keys());
  // roomList.forEach(room => {
  //   if (!room.includes('room')) {
  //     socket.leave(room)
  //   }
  // });

  socket.on('sendMsg', async (message) => {
    try {
      console.log('from user', message);
      await mesproc.MessageStore(message.msg);
      var svMsg = { ...message, type: 'serverMsg' };
      // socket.broadcast.emit('msgFromServer', svMsg);
      var romName = `room_${message.msg.group_id}`;
      // console.log(`Sent msg to room: ${romName}`, svMsg);
      socket.broadcast.to(romName).emit('msgFromServer', svMsg);
    } catch (error) {
      console.log(error);
    }

  });

  socket.on('joinRoom', (roomName) => {
    roomName.forEach(el => {
      console.log(el);
      socket.join(`room_${el}`);
    });
    const rooms = io.sockets.adapter.rooms;
    // socket.emit('roomList', Array.from(rooms.keys()));
    console.log('All room:');
    const roomList = Array.from(rooms.keys());
    console.log(roomList);
    console.log(io.in(roomList[0]).allSockets());
  });

  socket.on('readAllMSG', async (message) => {
    try {
      console.log('from user', message);
      await mesproc.MessageUnreadUpdate(message.msg, false);

    } catch (error) {
      console.log(error);
    }

  });

  socket.on('disconnect', () => {
    console.log(`User disconnected : [${socket.handshake.address}], with id [${socket.id}]`);
    console.log('Số lượng client đang kết nối:', getConnectedClientsCount());
  });
});


http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
