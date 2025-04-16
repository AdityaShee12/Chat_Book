import { app } from "./app.js";
import http from "http";
import { Server as socketio } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./models/user.models.js";
import { Message } from "./models/Message.models.js";
import { Notification } from "./models/notification.models.js";
import dotenv from "dotenv";
import { API } from "./Frontend_API.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer(app);
const io = new socketio(server, {
  cors: {
    origin: API,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("SI", socket.id);

  socket.on("new-user-joined", async (userId) => {
    console.log("JO");

    let user = await User.findById(userId);
    user.state = "online";
    await user.save();
    socket.join(userId);
    const notifications = await Notification.find({ "receiver.id": userId });
    if (notifications.length > 0) {
      notifications.forEach((notification) => {
        if (notification.messages.length > 0) {
          const lastMessage =
            notification.messages[notification.messages.length - 1];
          lastMessage;
          const senderId = notification.sender.id;
          io.to(userId).emit("last message", {
            userId: senderId,
            sms: lastMessage.text,
          });
        }
      });
    }
    user = await User.findById(userId);

    if (!user) {
      console.log("User not found");
      return;
    }

    // Step 2: Check if viewers exist
    if (!user.viewers || user.viewers.length === 0) {
      console.log("No viewers found");
      return;
    }
    user.viewers.forEach((viewerId) => {
      const roomId = viewerId.toString();
      io.to(roomId).emit(state, "online");
    });
  });

  socket.on("reciever add", async ({ OwnId, ToId }) => {
    console.log("ON");

    const user = await User.findById(ToId);
    if (user.state === "online") {
      io.to(OwnId).emit("state", "online");
    } else {
      io.to(OwnId).emit("state", "offline");
    }
    try {
      console.log("Work");
      const chatData = await Message.findOne({
        users: {
          $all: [{ $elemMatch: { id: OwnId } }, { $elemMatch: { id: ToId } }],
        },
      });
      console.log("CD", chatData);

      if (!chatData) return;

      const result = [];

      for (const msg of chatData.messages) {
        const isSender = msg.sender?.id?.toString() === OwnId;
        const isReceiver = msg.reciever?.id?.toString() === OwnId;
        console.log("se", isSender, isReceiver);

        if (isSender || isReceiver) {
          const messageData = {
            identifier: msg.identifier,
            text: msg.text,
            file: msg.file,
            timestamp: msg.timestamp,
          };
          console.log("SI", socket.id);

          if (isSender) {
            io.to(socket.id).emit("storedSendersms", messageData);
          }

          if (isReceiver) {
            io.to(socket.id).emit("storedReceiversms", messageData);
          }
        }
      }
    } catch (error) {
      console.error("Socket Error:", error.message);
    }
    const notifications = await Notification.findOneAndDelete({
      "sender.id": ToId,
      "receiver.id": OwnId,
    });
    if (notifications && notifications.messages.length > 0) {
      notifications.messages.forEach((message) => {
        io.to(OwnId).emit("receive message", {
          identifier: message.identifier,
          fileName: message.file?.fileName || null,
          fileType: message.file?.fileType || null,
          fileData: message.file?.fileData || null,
          sms: message.text,
        });
      });
    }
    user.viewers.push(OwnId);
    user.selectedUser = ToId;
    await user.save();
  });

  socket.on("send message", async (data) => {
    console.log("send");

    try {
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
      let finalData = sms;
      if (fileData) {
        const filePath = path.join(__dirname, "uploads", fileName);
        fs.writeFileSync(filePath, Buffer.from(fileData));
      }
      io.to(OwnId).emit("last message", { userId: ToId, sms });
      io.to(ToId).emit("last message", { userId: OwnId, sms });
      const user = await User.findById(ToId);
      if (user.selectedUser === OwnId) {
        io.to(ToId).emit("receive message", {
          identifier,
          fileName,
          fileType,
          fileData,
          sms,
        });
      } else {
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
      }
      let existingChat = await Message.findOne({
        "users.id": { $all: [OwnId, ToId] },
      });
      if (existingChat) {
        existingChat.messages.push({
          sender: { id: OwnId },
          reciever: { id: ToId },
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
        });
        await existingChat.save();
      } else {
        let newChat = new Message({
          users: [
            { id: OwnId, name: OwnName },
            { id: ToId, name: ToName },
          ],
          messages: [
            {
              sender: { id: OwnId },
              reciever: { id: ToId },
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
    } catch (err) {
      console.error("Message Transfer Error:", err);
    }
  });

  socket.on("offline_User sms", async (data) => {
    console.log("sendt");

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

  socket.on("delete-everyone", async (data) => {
    const { OwnId, ToId, identifier } = data;
    console.log(OwnId, ToId);
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
    const TosocketId = redisClient.hGet(`userId:${ToId}`, "socketId");
    io.to(TosocketId).emit("delete", { identifier }); // Successfully deleted
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
});

export { server };
