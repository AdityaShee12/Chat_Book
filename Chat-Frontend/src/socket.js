import { io } from "socket.io-client";
import { API } from "./Backend_API.js";
const socket = io(API, {
  withCredentials: true,
});

export default socket;