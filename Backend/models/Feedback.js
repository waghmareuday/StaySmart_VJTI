const mongoose=require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  feedback: { type: String, required: true },
  rating: { type: Number, required: true },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports= Feedback;
