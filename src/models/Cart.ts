import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productSlug: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, required: false },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // Ensure one cart per user
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;
