// In-memory registry of the classes that are running right now (one entry per live class).
// Only the signalling server (live/socket.js) writes to it; services read it to show "12 students inside".
const rooms = new Map();

const getRoom = (classId) => rooms.get(String(classId));

/** { students, hostPresent } of a running class, or zeros */
const getRoomInfo = (classId) => {
  const room = rooms.get(String(classId));
  return room ? { students: room.students.size, hostPresent: Boolean(room.host) } : { students: 0, hostPresent: false };
};

module.exports = { rooms, getRoom, getRoomInfo };