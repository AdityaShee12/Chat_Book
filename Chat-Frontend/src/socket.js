import { io } from "socket.io-client";

const socket = io("https://chat-book-u2yq.onrender.com", {
  withCredentials: true,
});

export default socket;
