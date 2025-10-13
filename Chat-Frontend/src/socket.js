import { io } from "socket.io-client";

const socket = io("https://real-time-chat-application-klxp.onrender.com", {
  withCredentials: true,
});

export default socket;
