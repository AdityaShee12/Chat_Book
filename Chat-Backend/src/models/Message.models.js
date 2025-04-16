import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema({
  users: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
  ],

  messages: [
    {
      sender: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      reciever: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      identifier: { type: String, unique: true },
      text: { type: String },
      file: {
        fileName: { type: String },
        fileType: { type: String },
        fileData: { type: String },
      },
      sender_delete: { type: Boolean, default: false },
      reciever_delete: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now }, // Message timestamp
    },
  ],
});

export const Message = mongoose.model("Message", messageSchema);
