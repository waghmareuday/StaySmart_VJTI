const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

    name :{
        type:String,
        required:true
    },
    email :{ 
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim: true
    },
    collegeId:{
         type:Number,
        required:true,
        unique: true
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
    },
    messBalance: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    }
});

module.exports = mongoose.model('User',userSchema);