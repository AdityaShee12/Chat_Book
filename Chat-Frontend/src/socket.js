import { io } from "socket.io-client";
import { BACKEND_API } from "./Backend_API";
const socket = io(BACKEND_API, {
  withCredentials: true,
});

export default socket;
