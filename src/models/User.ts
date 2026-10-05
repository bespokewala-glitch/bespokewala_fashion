import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: false }, // Made optional to support existing users
  password: { type: String, required: false }, // Optional for passwordless / OAuth auth
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  // OAuth fields
  googleId: { type: String, default: null, sparse: true }, // Google sub claim
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  addresses: [addressSchema]
}, {
  timestamps: true
});

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ mobileNumber: 1 }, { sparse: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
