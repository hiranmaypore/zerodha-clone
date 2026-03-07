import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';


let socket = null;


export const connectSocket = () => {
  if (socket?.connected) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  return socket;
};

export const joinUserRoom = (userId) => {
  if (socket) {
    socket.emit('join_user_room', userId);
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
