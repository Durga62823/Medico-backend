exports.sendNotification = (io, room, event, data) => {
    io.to(room).emit(event, data);
  };
  