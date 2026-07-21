import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: false }, // Made optional to support existing users
  password: { type: String, required: false }, // Optional for passwordless auth
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
