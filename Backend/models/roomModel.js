const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  block: { type: String, enum: ['C', 'PG', 'A'], required: true },
  floor: { type: Number, required: true },
  capacity: { type: Number, required: true },
  gender: { type: String, enum: ['M', 'F'], required: true },
  isAvailable: { type: Boolean, default: true },
  occupants: [{ type: String, ref: 'Application' }],
  allottedAt: { type: Date, default: null }, // When the room was last allocated
  allotmentRound: { type: Number, default: null }, // Which allocation round this belongs to
  lastModified: { type: Date, default: Date.now }
});

// Compound unique index on roomNumber + block
roomSchema.index({ roomNumber: 1, block: 1 }, { unique: true });

// Virtual getter to validate occupants don't exceed capacity
roomSchema.virtual('occupancyRate').get(function() {
  return (this.occupants?.length || 0) / this.capacity;
});

// Validate occupants don't exceed capacity
roomSchema.pre('save', function(next) {
  if (this.occupants && this.occupants.length > this.capacity) {
    return next(new Error(`Room ${this.roomNumber} (${this.block}) exceeds capacity. Max: ${this.capacity}, Got: ${this.occupants.length}`));
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);