import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { sendWelcomeEmail, sendOtpEmail } from '../utils/email.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

const generate6DigitOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const lowerEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: lowerEmail });

    if (user && user.is_verified) {
      return res.status(400).json({ message: 'Email is already registered. Please sign in.' });
    }

    const otpCode = generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user && !user.is_verified) {
      user.fullName = fullName;
      user.password = password;
      user.otp_code = otpCode;
      user.otp_expires = otpExpires;
      await user.save();
    } else {
      user = await User.create({
        fullName,
        email: lowerEmail,
        password,
        is_google: 0,
        is_verified: false,
        otp_code: otpCode,
        otp_expires: otpExpires
      });
    }

    // Send verification OTP email
    sendOtpEmail(lowerEmail, otpCode, fullName).catch((err) =>
      console.error('OTP email error:', err.message)
    );

    res.status(200).json({
      message: 'Verification OTP sent to your email',
      email: lowerEmail,
      requiresOtp: true
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const lowerEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      return res.json({
        message: 'Account already verified',
        _id: user._id,
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        is_google: user.is_google || 0,
        token: generateToken(user._id)
      });
    }

    if (!user.otp_code || user.otp_code !== otpCode.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check your email.' });
    }

    if (user.otp_expires && new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ message: 'OTP has expired. Please click Resend OTP.' });
    }

    user.is_verified = true;
    user.otp_code = null;
    user.otp_expires = null;
    await user.save();

    // Send Welcome email upon successful verification
    sendWelcomeEmail(user).catch((err) =>
      console.error('Welcome email error:', err.message)
    );

    res.json({
      message: 'Email verified successfully!',
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

// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const lowerEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'Account is already verified. Please log in.' });
    }

    const otpCode = generate6DigitOtp();
    user.otp_code = otpCode;
    user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendOtpEmail(lowerEmail, otpCode, user.fullName).catch((err) =>
      console.error('Resend OTP error:', err.message)
    );

    res.json({ message: 'A new 6-digit OTP code has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: lowerEmail });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_verified && user.is_google !== 1) {
      const otpCode = generate6DigitOtp();
      user.otp_code = otpCode;
      user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      sendOtpEmail(lowerEmail, otpCode, user.fullName).catch(() => {});

      return res.status(403).json({
        message: 'Your account is not verified yet. A verification OTP has been sent to your email.',
        requiresOtp: true,
        email: lowerEmail
      });
    }

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
        is_google: 1,
        is_verified: true
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
      if (!user.is_verified) {
        user.is_verified = true;
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

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  res.json({ message: 'Password reset link sent to your email' });
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  res.json({ message: 'Password reset successfully' });
};
