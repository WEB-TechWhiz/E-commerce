import mongoose from 'mongoose';

const userInteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  interactionType: { type: String, required: true },
  // other fields...
});

export default mongoose.model('UserInteraction', userInteractionSchema);
