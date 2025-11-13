import { app } from "./app.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./models/user.models.js";
import { Message } from "./models/Message.models.js";
import { Notification } from "./models/notification.models.js";
import fs from "fs";
import dotenv from "dotenv";
import { FRONTEND_API } from "./Frontend_API.js";

dotenv.config({ path: "./.env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_API,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let users = {};

io.on("connection", (socket) => {
  // Chatting System
  socket.on("new-user-joined", async (userId, userName) => {
    console.log("userId", userId, userName);
    socket.join(userId);
    if (users[userId]) {
      // Existing object ke preserve kore socketId update kora holo
      users[userId].socketId = socket.id;
      users[userId].name = userName;
      // viewers check kore map kora holo
      if (users[userId].viewers) {
        console.log("1");
        users[userId].viewers.map((viewerId) => {
          console.log("2");
          if (users[viewerId]?.selectedUser === userId) {
            console.log("3");
            io.to(users[viewerId].id).emit("state", "online");
          }
        });
      }
    } else {
      users[userId] = { id: userId, name: userName, socketId: socket.id };
    }
    console.log("user joined", users);
  });

  socket.on(
    "reciever add",
    async ({ userId, userName, receiverId, receiverName }) => {
      try {
        // send online or offline state
        users[userId].selectedUser = receiverId;
        if (users[receiverId]) {
          if (users[receiverId].socketId) {
            if (users[receiverId].viewers) {
              users[receiverId].viewers.push(userId);
            } else {
              users[receiverId].viewers = [userId];
            }
          } else {
            if (users[receiverId].viewers) {
              users[receiverId].viewers.push(userId);
            } else {
              users[receiverId].viewers = [userId];
            }
          }
          io.to(userId).emit("state", "online");
        } else {
          users[receiverId] = {
            name: receiverName,
            viewers: [userId],
            socketId: null,
          };
          io.to(userId).emit("state", "offline");
        }

        const otherUsers = await User.findById(userId);
        console.log("oth", otherUsers);

        let isRelation = false;
        otherUsers?.otherUsers?.map((user) => {
          if (user.id.toString() === receiverId) {
            console.log("U R Id", user.id, receiverId);
            isRelation = true;
          }
        });

        if (isRelation) {
          console.log("ISrel");

          // store previous message
          const chatData = await Message.findOne({
            users: {
              $all: [
                { $elemMatch: { id: userId } },
                { $elemMatch: { id: receiverId } },
              ],
            },
          });
          if (chatData) {
            if (chatData.messages) {
              console.log("state");

              for (const message of chatData.messages) {
                if (message.relation === "accept") {
                  io.to(userId).emit("friends", { requestState: "accept" });
                  io.to(userId).emit("storedSendersms", message);
                } else if (message.relation === "reject") {
                  io.to(userId).emit("friends", { requestState: "reject" });
                  io.to(userId).emit("storedSendersms", message);
                } else if (message.relation === "sent") {
                  io.to(userId).emit("friends", { requestState: "sent" });
                  io.to(userId).emit("storedSendersms", message);
                } else {
                  io.to(userId).emit("friends", { requestState: "friend" });
                  io.to(userId).emit("storedSendersms", message);
                }
              }
            }
          }
        } else {
          console.log("Nostate");

          io.to(userId).emit("friends", { requestState: "noFriend" });
        }
      } catch (error) {
        console.error("Socket Error:", error);
      }
    }
  );

  socket.on("check after reload", ({ userId, receiverId }) => {
    if (users[receiverId] && users[receiverId].socketId) {
      if (users[receiverId].viewers) {
        users[receiverId].viewers.push(userId);
      } else {
        users[receiverId].viewers = [userId];
      }
      io.to(userId).emit("state", "online");
    } else {
      users[receiverId] = { viewers: [userId], socketId: null };
      io.to(userId).emit("state", "offline");
    }
  });

  socket.on("send message", async (data) => {
    try {
      const {
        userId,
        userName,
        userAvatar,
        receiverId,
        receiverName,
        receiverAvatar,
        identifier,
        sms,
        fileName,
        fileType,
        fileData,
      } = data;
      if (fileData) {
        const filePath = path.join(__dirname, "uploads", fileName);
        fs.writeFileSync(filePath, Buffer.from(fileData));
      }
      if (fileData) {
        io.to(userId).emit("last message", {
          userId: receiverId,
          sms,
          fileType,
          fileName,
        });
        io.to(receiverId).emit("last message", {
          userId: userId,
          sms,
          fileType,
          fileName,
        });
      } else {
        io.to(userId).emit("last message", { userId: receiverId, sms });
        io.to(receiverId).emit("last message", { userId: userId, sms });
      }
      if (users[receiverId]) {
        if (users[receiverId].selectedUser === userId) {
          io.to(receiverId).emit("receive message", {
            identifier,
            fileName,
            fileType,
            fileData,
            sms,
          });
          let existingChat = await Message.findOne({
            "users.id": { $all: [userId, receiverId] },
          });
          if (existingChat) {
            existingChat.messages.push({
              sender: { id: userId },
              reciever: { id: receiverId },
              relation: "friend",
              identifier: identifier,
              text: sms,
              sender_delete: false,
              reciever_delete: false,
              file: {
                fileName,
                fileType,
                fileData,
              },
              timestamp: Date.now(),
            });
            await existingChat.save();
          } else {
            let newChat = new Message({
              users: [
                { id: userId, name: userName, avatar: userAvatar },
                { id: receiverId, name: receiverName, avatar: receiverAvatar },
              ],
              messages: [
                {
                  sender: { id: userId },
                  reciever: { id: receiverId },
                  relation: "friend",
                  identifier,
                  text: sms,
                  sender_delete: false,
                  reciever_delete: false,
                  file: {
                    fileName,
                    fileType,
                    fileData,
                  },
                  timestamp: Date.now(),
                },
              ],
            });
            await newChat.save();
          }
        }
      } else {
        try {
          const existingNotification = await Notification.findOne({
            "sender.id": userId,
            "receiver.id": receiverId,
          });

          const newMessage = {
            identifier,
            text: sms,
            file: fileName ? { fileName, fileType, fileData } : undefined,
            sender_delete: false,
            timestamp: Date.now(),
          };
          if (existingNotification) {
            await Notification.updateOne(
              { "sender.id": userId, "receiver.id": receiverId },
              { $push: { messages: newMessage } }
            );
          } else {
            await Notification.create({
              sender: { id: userId, name: userName },
              receiver: { id: receiverId, name: receiverName },
              identifier,
              messages: [newMessage],
            });
          }
        } catch (error) {
          console.error("Error saving notification:", error);
        }
      }
    } catch (err) {
      console.error("Message Transfer Error:", err);
    }
  });

  socket.on("sendRequest", async (data) => {
    const {
      userId,
      userName,
      userAvatar,
      receiverId,
      receiverName,
      receiverAvatar,
      identifier,
    } = data;
    const messages = await Message.create({
      users: [
        { id: userId, name: userName, avatar: userAvatar },
        { id: receiverId, name: receiverName, avatar: receiverAvatar },
      ],
      messages: [
        {
          sender: { id: userId },
          reciever: { id: receiverId },
          identifier: identifier,
          relation: "sent",
          text: "",
          sender_delete: false,
          reciever_delete: false,
          timestamp: Date.now(),
        },
      ],
    });
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          otherUsers: { id: receiverId },
        },
      },
      { new: true } // updated doc return করবে
    ).select("otherUsers");
    await User.findByIdAndUpdate(
      receiverId,
      {
        $addToSet: {
          otherUsers: { id: userId },
        },
      },
      { new: true } // updated doc return করবে
    ).select("otherUsers");

    const message = messages.messages[0];
    console.log("sendRequestB");

    io.to(receiverId).emit("friends", { requestState: "sent" });
    io.to(receiverId).emit("storedSendersms", message);
  });

  socket.on("acceptRequest", async (data) => {
    const { userId, receiverId, accept } = data;
    if (accept === 1) {
      let existingChat = await Message.findOne({
        "users.id": { $all: [userId, receiverId] },
      });
      // check if there is a message with relation "sent"
      let sentMessage = existingChat.messages.find(
        (msg) => msg.relation === "sent"
      );
      // Update that message's relation to "friend"
      await Message.updateOne(
        {
          _id: existingChat._id,
          "messages._id": sentMessage._id,
        },
        {
          $set: { "messages.$.relation": "friend" },
        }
      );
      io.to(receiverId).emit("requestReply", { accept: 1 });
      io.to(userId).emit("friends", { requestState: "friend" });
      console.log("Accept");
    } else {
      let existingChat = await Message.findOne({
        "users.id": { $all: [userId, receiverId] },
      });
      // check if there is a message with relation "sent"
      let sentMessage = existingChat.messages.find(
        (msg) => msg.relation === "sent"
      );
      // Update that message's relation to "friend"
      await Message.updateOne(
        {
          _id: existingChat._id,
          "messages._id": sentMessage._id,
        },
        {
          $set: { "messages.$.relation": "reject" },
        }
      );
      io.to(receiverId).emit("requestReply", { accept: 0 });
      io.to(userId).emit("friends", { requestState: "reject" });
      console.log("Reject");
    }
  });

  socket.on("offline_User sms", async (data) => {
    const {
      OwnId,
      OwnName,
      ToId,
      ToName,
      identifier,
      sms,
      fileName,
      fileType,
      fileData,
    } = data;

    io.to(OwnId).emit("last message", { userId: ToId, sms });
    try {
      const existingNotification = await Notification.findOne({
        "sender.id": OwnId,
        "receiver.id": ToId,
      });

      const newMessage = {
        identifier,
        text: sms,
        file: fileName ? { fileName, fileType, fileData } : undefined,
        sender_delete: false,
        timestamp: Date.now(),
      };

      if (existingNotification) {
        await Notification.updateOne(
          { "sender.id": OwnId, "receiver.id": ToId },
          { $push: { messages: newMessage } }
        );
      } else {
        await Notification.create({
          sender: { id: OwnId, name: OwnName },
          receiver: { id: ToId, name: ToName },
          identifier,
          messages: [newMessage],
        });
      }
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  });

  socket.on("video-call", (ToId) => {
    socket.to(ToId).emit("joined");
  });

  socket.on("ice-candidate", (candidate, ToId) => {
    socket.to(ToId).emit("ice-candidate", candidate);
    console.log("candidate");
  });

  socket.on("offer", (offer, ToId) => {
    socket.to(ToId).emit("offer", offer);
    console.log("OFFER");
  });

  socket.on("answer", (answer, ToId) => {
    socket.to(ToId).emit("answer", answer);
    console.log("answer");
  });

  socket.on("delete-everyone", async (data) => {
    const { OwnId, ToId, identifier } = data;
    console.log("OwnId,ToId", OwnId, ToId);
    try {
      // Step 1: Find the document
      const chat = await Message.findOne({
        "users.id": { $all: [OwnId, ToId] },
      });

      if (!chat) {
        console.log("No chat found!");
        return;
      }

      // Step 2: Find the index of the message with the given identifier
      const messageIndex = chat.messages.findIndex(
        (msg) => msg.identifier === identifier
      );

      if (messageIndex === -1) {
        console.log("Message not found!");
        return;
      }

      // Step 3: Remove the message from the array
      chat.messages.splice(messageIndex, 1);

      // Step 4: Save the updated document
      await chat.save();
      console.log("Message deleted successfully!");
    } catch (error) {
      console.log(error);
    }
    io.to(ToId).emit("delete", identifier); // Successfully deleted
  });

  socket.on("delete-me", async (data) => {
    const { OwnId, ToId, identifier, sender } = data;
    try {
      // Step 1: Find the document
      const chat = await Message.findOne({
        "users.id": { $all: [OwnId, ToId] },
      });
      if (!chat) {
        console.log("No chat found!");
        return;
      }
      // Step 2: Find the index of the message with the given identifier
      const message = chat.messages.find(
        (msg) => msg.identifier === identifier
      );
      if (!message) {
        console.log("Message not found!");
        return;
      }
      if (sender === "You") {
        message.sender_delete = true;
      } else {
        message.reciever_delete = true;
      }
      if (message.sender_delete && message.reciever_delete) {
        chat.messages = chat.messages.filter(
          (msg) => msg.identifier !== identifier
        );
      }
      // Step 4: Save the updated document
      await chat.save();
      console.log("Message deleted successfully!");
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", async () => {
    const match = Object.values(users).find(
      (user) => user.socketId === socket.id
    );
    if (match && match.viewers) {
      match.viewers.map((socketId) => {
        if (users[socketId].selectedUser === match.id) {
          io.to(socketId).emit("checkDisconnect", "offline");
        }
        if (users[socketId]?.viewers) {
          users[socketId].viewers = users[socketId].viewers.filter((id) => {
            id == match.id;
          });
        }
      });
    }
    if (match) {
      delete users[match.id];
    }
  });
});

export { server };
