const mongoose =require("mongoose");

const MessOffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  option: { type: String, enum: ["Off", "Join"], required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

 const messoff=mongoose.model("MessOff", MessOffSchema);
module.exports=messoff;
