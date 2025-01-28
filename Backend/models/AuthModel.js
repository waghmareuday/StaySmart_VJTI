const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

    name :{
        type:String,
        required:true
    },
    email :{ 
        type:String,
        required:true
    },
    collegeId:{
         type:Number,
        required:true
    },
    password :{
         type:String,
        required:true
    },
    mobileNo:{
        type:String,
    },
    roomNo:{
        type:String
    },
    Address:{
        type:String
    }
});

module.exports = mongoose.model('User',userSchema);