const mongoose = require('mongoose');

const lostnfoundSchema = new mongoose.Schema({
    itemType: {
        type: String,
        enum: ["lost", "found"],
        required: true,
      },
      itemName: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      location: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
        required: true,
      },
      imageURL: {
        type: String,
        default: null,
      },
}, { timestamps: true });

const lostnfound = mongoose.model('LostnFound', lostnfoundSchema);

module.exports = lostnfound;