const mongoose=require('mongoose')

const hostelLeavingSchema=new mongoose.Schema({
    name:{ type:String,required:true},
    rollNo:{ type:Number,required:true},
    roomNo:{ type:String,required:true},
    dateOfDepartur:{ type:Date,required:true},
    contact:{ type:Number,required:true},
    reason:{ type:String,required:true}
});
const HostelLeaving=mongoose.model('HostelLeavingForm',hostelLeavingSchema)

module.exports=HostelLeaving;