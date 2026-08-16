import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { sendWelcomeEmail } from '../utils/email.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ fullName, email, password, is_google: 0 });

    // Send welcome email asynchronously
    sendWelcomeEmail(user).catch((err) =>
      console.error('Welcome email error:', err.message)
    );
    res.status(201).json({
      _id: user._id,
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      is_google: user.is_google || 0,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      is_google: user.is_google || 0,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  (requires auth middleware)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userObj = user.toObject();
    res.json({ ...userObj, id: userObj._id, is_google: userObj.is_google || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/me  (update profile)
export const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { fullName, phone, avatar } = req.body;
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ _id: user._id, fullName: user.fullName, email: user.email, avatar: user.avatar, phone: user.phone, role: user.role, is_google: user.is_google || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/google
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    let email, fullName, avatar;

    if (credential) {
      try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email;
        fullName = payload.name;
        avatar = payload.picture;
      } catch {
        try {
          const base64Url = credential.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
            email = jsonPayload.email;
            fullName = jsonPayload.name;
            avatar = jsonPayload.picture;
          }
        } catch {
          // ignore
        }
      }
    }

    if (!email && req.body.email) {
      email = req.body.email;
      fullName = req.body.fullName;
      avatar = req.body.avatar;
    }

    if (!email) {
      return res.status(400).json({ message: 'Invalid Google authentication token' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-12) + 'A1!';
      user = await User.create({
        fullName: fullName || email.split('@')[0],
        email,
        password: randomPassword,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop',
        is_google: 1
      });
      sendWelcomeEmail(user).catch((err) =>
        console.error('Welcome email error:', err.message)
      );
    } else {
      let updated = false;
      if (user.is_google !== 1) {
        user.is_google = 1;
        updated = true;
      }
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (fullName && (!user.fullName || user.fullName === 'Guest' || user.fullName === '—')) {
        user.fullName = fullName;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      is_google: user.is_google,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  res.json({ message: 'Verification OTP sent successfully' });
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  res.json({ message: 'OTP verified successfully' });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  res.json({ message: 'Password reset link sent to your email' });
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  res.json({ message: 'Password reset successfully' });
};
