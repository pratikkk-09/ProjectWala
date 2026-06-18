import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'User' },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Admin' },
}, { timestamps: true });

export const Admin = mongoose.model('Admin', adminSchema);

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  fileUrl: { type: String, required: true }, // URL or path to download
  previewImage: { type: String, default: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80' },
  previewUrl: { type: String }
}, { timestamps: true });

export const Project = mongoose.model('Project', projectSchema);

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  upiRef: { type: String },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  screenshotUrl: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
