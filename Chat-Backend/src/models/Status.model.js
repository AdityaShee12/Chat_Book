import mongoose, { Schema } from "mongoose";

const statusSchema = new Schema({
  uploader: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
  },
  status: [
    {
      file: {
        type: String,
      },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

export const Status = mongoose.model("Status", statusSchema);
