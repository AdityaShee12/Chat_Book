import { mongoose, Schema } from "mongoose";

const notificationSchema = new Schema({
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
  },
  receiver: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
  },
  messages: [
    {
      identifier: { type: String, unique: true },
      text: { type: String, required: true }, // Message text
      file: {
        fileName: { type: String },
        fileType: { type: String },
        fileData: { type: String },
      },
      sender_delete: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now }, // Message timestamp
    },
  ],
});

export const Notification = mongoose.model("Notification", notificationSchema);
