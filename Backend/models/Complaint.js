const mongoose =require("mongoose");

const ComplaintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  details: { type: String, required: true },
},
{
    timestamps: true,
}
);
    
const Complaint =mongoose.model("Complaint", ComplaintSchema);
module.exports =Complaint