import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, expires: '5m', default: Date.now } // Automatically delete document after 5 minutes
});

// Since Next.js can hot-reload, check if model exists before compiling
const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default Otp;
