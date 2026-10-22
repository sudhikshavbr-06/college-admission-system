export const emitToUser = (req, userId, event, payload) => {
  const io = req.app.get('io');
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

export const emitToAdmins = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.to('admins').emit(event, payload);
};
