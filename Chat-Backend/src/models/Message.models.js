import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema({
  users: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      avatar: { type: String },
    },
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      avatar: { type: String },
    },
  ],
  messages: [
    {
      sender: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      receiver: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      identifier: { type: String, unique: true },
      relation: { type: String },
      text: { type: String },
      file: {
        fileName: { type: String },
        fileType: { type: String },
        fileData: { type: String },
      },
      sender_delete: { type: Boolean, default: false },
      receiver_delete: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now }, // Message timestamp
    },
  ],
});

export const Message = mongoose.model("Message", messageSchema);
