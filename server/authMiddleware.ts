import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { initFirebaseDb } from './firebaseStore.js';
import { doc, getDoc } from 'firebase/firestore';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    
    const db = initFirebaseDb();
    if (!db) {
       res.status(500).json({ message: 'Database not initialized' });
       return;
    }

    const docSnap = await getDoc(doc(db, 'users', decoded.id));

    if (docSnap.exists()) {
       const userData = docSnap.data();
       delete userData.password;
       req.user = userData;
    } else {
       res.status(401).json({ message: 'User not found' });
       return;
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
    return;
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
    return;
  }
};
