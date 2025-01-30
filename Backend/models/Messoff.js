import mongoose from "mongoose";

const MessOffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  option: { type: String, enum: ["Off", "Join"], required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("MessOff", MessOffSchema);
