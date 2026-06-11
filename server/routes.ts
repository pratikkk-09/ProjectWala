import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { protect, adminOnly, AuthRequest } from './authMiddleware.js';
import { initFirebaseDb } from './firebaseStore.js';
import { collection, query, where, getDocs, getDoc, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const apiRouter = express.Router();

const getDb = () => initFirebaseDb();

// --- Auth Routes ---
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const assignedRole = role || 'User';
    const isAdmin = assignedRole === 'Admin';
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const docRef = doc(usersRef);
    const userObj = {
      _id: docRef.id,
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, userObj);

    const token = jwt.sign({ id: userObj._id, role: userObj.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
    res.status(201).json({ _id: userObj._id, name: userObj.name, email: userObj.email, role: userObj.role, token });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userData = querySnapshot.docs[0].data();
    
    // Check if role matches what's requested, or default just let user in
    // if requested admin and not admin, deny
    if (role === 'Admin' && userData.role !== 'Admin') {
       return res.status(403).json({ message: 'Access denied' });
    }

    if (await bcrypt.compare(password, userData.password)) {
      const token = jwt.sign({ id: userData._id, role: userData.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
      res.json({ _id: userData._id, name: userData.name, email: userData.email, role: userData.role, token });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// --- Public Project Routes ---
apiRouter.get('/projects', async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.json([]);
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const projects = projectsSnapshot.docs.map(doc => doc.data());
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

apiRouter.get('/projects/:id', async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(404).json({ message: 'Project not found' });
    
    const docRef = doc(db, 'projects', req.params.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
       res.json(docSnap.data());
    } else {
       res.status(404).json({ message: 'Project not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// --- File Upload Setup ---
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// --- Admin Routes ---
apiRouter.post('/admin/projects', protect, adminOnly, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req: AuthRequest, res) => {
  try {
    const { title, description, category, price, previewUrl } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const fileUrl = files?.['file']?.[0] ? `/uploads/${files['file'][0].filename}` : '';
    const previewImage = files?.['image']?.[0] ? `/uploads/${files['image'][0].filename}` : req.body.previewImage; 
    
    if (!fileUrl) return res.status(400).json({ message: 'Project file is required' });

    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const newProjectRef = doc(collection(db, 'projects'));
    const project = {
      _id: newProjectRef.id,
      title, 
      description, 
      category, 
      price: Number(price), 
      fileUrl, 
      previewImage: previewImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', 
      previewUrl: previewUrl || '',
      createdAt: new Date().toISOString()
    };

    await setDoc(newProjectRef, project);
    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

apiRouter.put('/admin/projects/:id', protect, adminOnly, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req: AuthRequest, res) => {
  try {
    const { title, description, category, price, previewUrl } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    let updateData: any = { title, description, category, price: Number(price), previewUrl: previewUrl || '' };
    
    if (files?.['file']?.[0]) updateData.fileUrl = `/uploads/${files['file'][0].filename}`;
    if (files?.['image']?.[0]) updateData.previewImage = `/uploads/${files['image'][0].filename}`;
    else if (req.body.previewImage) updateData.previewImage = req.body.previewImage;

    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const projectRef = doc(db, 'projects', req.params.id);
    await updateDoc(projectRef, updateData);
    
    const updatedSnap = await getDoc(projectRef);
    res.json(updatedSnap.data());
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

apiRouter.delete('/admin/projects/:id', protect, adminOnly, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    
    await deleteDoc(doc(db, 'projects', req.params.id));
    res.json({ message: 'Project removed' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

apiRouter.get('/admin/users', protect, adminOnly, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    if (!db) return res.json([]);

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => {
       const data = doc.data();
       delete data.password;
       return data;
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

apiRouter.get('/admin/purchases', protect, adminOnly, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    if (!db) return res.json([]);

    const purchasesSnap = await getDocs(collection(db, 'purchases'));
    const purchases = purchasesSnap.docs.map(doc => doc.data());
    
    // Populate user and project info
    const populated = await Promise.all(purchases.map(async p => {
       let user = { name: 'Unknown', email: '' };
       if (p.userId) {
          const userSnap = await getDoc(doc(db, 'users', p.userId));
          if (userSnap.exists()) user = userSnap.data() as any;
       }
       let project = { title: 'Unknown', price: 0 };
       if (p.projectId) {
          const projectSnap = await getDoc(doc(db, 'projects', p.projectId));
          if (projectSnap.exists()) project = projectSnap.data() as any;
       }
       return { ...p, userId: user, projectId: project };
    }));

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

apiRouter.put('/admin/purchases/:id/status', protect, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const purchaseRef = doc(db, 'purchases', req.params.id);
    await updateDoc(purchaseRef, { status });
    const updatedSnap = await getDoc(purchaseRef);

    res.json({ message: 'Purchase status updated', purchase: updatedSnap.data() });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// --- Checkout and Payment ---
apiRouter.post('/payment/create-order', protect, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.body;
    
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const projectSnap = await getDoc(doc(db, 'projects', projectId));
    if (!projectSnap.exists()) return res.status(404).json({ message: 'Project not found' });
    const project = projectSnap.data();

    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('rzp_test_yourkeyid')) {
        return res.json({
          id: `fake_order_${Date.now()}`,
          amount: project.price * 100,
          currency: 'INR',
          projectId: project._id,
          mock: true
        });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });

    const options = {
      amount: project.price * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };
    
    const order = await razorpay.orders.create(options);
    res.json({ ...order, projectId: project._id, mock: false });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create order: ' + error.message });
  }
});

apiRouter.post('/payment/verify', protect, upload.single('screenshot'), async (req: AuthRequest, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, projectId, amount, mock, upiRef, name, email, phone } = req.body;
    const isMock = mock === 'true' || mock === true;

    if (!isMock) {
       const body = razorpay_order_id + "|" + razorpay_payment_id;
       const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                                       .update(body.toString())
                                       .digest('hex');
       if(expectedSignature !== razorpay_signature) {
          return res.status(400).json({ message: "Invalid signature" });
       }
    }

    const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const purchaseRef = doc(collection(db, 'purchases'));
    const purchase = {
      _id: purchaseRef.id,
      userId: req.user._id,
      projectId,
      paymentId: razorpay_payment_id || `fake_payment_${Date.now()}`,
      amount: Number(amount) / 100,
      status: isMock ? 'pending' : 'approved',
      upiRef: upiRef || '',
      name: name || '',
      email: email || '',
      phone: phone || '',
      screenshotUrl,
      createdAt: new Date().toISOString()
    };

    await setDoc(purchaseRef, purchase);
    res.json({ message: "Payment info submitted. Awaiting admin approval.", purchase });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// --- User Dashboard ---
apiRouter.get('/dashboard', protect, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    if (!db) return res.json([]);

    const q = query(collection(db, 'purchases'), where('userId', '==', req.user._id));
    const purchasesSnap = await getDocs(q);
    const purchases = purchasesSnap.docs.map(doc => doc.data());

    const populated = await Promise.all(purchases.map(async p => {
       let project = null;
       if (p.projectId) {
          const projectSnap = await getDoc(doc(db, 'projects', p.projectId));
          if (projectSnap.exists()) project = projectSnap.data();
       }
       return { ...p, projectId: project };
    }));

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// --- Secure Download ---
apiRouter.get('/download/:projectId', protect, async (req: AuthRequest, res) => {
  try {
     const db = getDb();
     if (!db) return res.status(500).json({ message: 'Database not initialized' });

     const q = query(collection(db, 'purchases'), where('userId', '==', req.user._id), where('projectId', '==', req.params.projectId));
     const purchasesSnap = await getDocs(q);
     const purchase = purchasesSnap.empty ? null : purchasesSnap.docs[0].data();

     if ((!purchase || purchase.status !== 'approved') && req.user.role !== 'Admin') {
       return res.status(403).json({ message: 'Purchase pending approval or not found.' });
     }
     
     const projectSnap = await getDoc(doc(db, 'projects', req.params.projectId));
     if (!projectSnap.exists()) return res.status(404).json({ message: 'Project not found' });
     const project = projectSnap.data();

     if (!project.fileUrl) {
        return res.status(404).json({ message: 'File not found' });
     }

     const filePath = path.join(process.cwd(), project.fileUrl);
     if (fs.existsSync(filePath)) {
        res.download(filePath);
     } else {
        res.status(404).json({ message: 'Physical file not found on server' });
     }
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});
