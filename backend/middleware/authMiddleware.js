import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';

export const protect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || (
        process.env.NODE_ENV === 'production'
          ? (() => { throw new Error('FATAL: JWT_SECRET environment variable is missing in production'); })()
          : 'sehatbuddy_super_secure_jwt_secret_dev_fallback_2026'
      );
      const decoded = jwt.verify(token, secret);

      let user = null;
      let role = decoded.role;

      // 1. If role is explicitly encoded in token
      if (role === 'admin') {
        user = await Admin.findById(decoded.id);
      } else if (role === 'doctor') {
        user = await Doctor.findById(decoded.id);
      } else if (role === 'hospital') {
        user = await Hospital.findById(decoded.id);
      } else if (role === 'user') {
        user = await User.findById(decoded.id);
      }

      // 2. Fallback lookup across collections if role was missing from legacy token
      if (!user) {
        user = await Admin.findById(decoded.id);
        if (user) {
          role = 'admin';
        } else {
          user = await Doctor.findById(decoded.id);
          if (user) {
            role = 'doctor';
          } else {
            user = await Hospital.findById(decoded.id);
            if (user) {
              role = 'hospital';
            } else {
              user = await User.findById(decoded.id);
              if (user) {
                role = 'user';
              }
            }
          }
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: User account no longer exists'
        });
      }

      // Multi-device session revocation check
      if (
        user.tokenVersion !== undefined &&
        decoded.tokenVersion !== undefined &&
        decoded.tokenVersion !== user.tokenVersion
      ) {
        return res.status(401).json({
          success: false,
          message: 'Session has been revoked or expired due to a password change. Please log in again.'
        });
      }

      req.user = {
        id: user._id.toString(),
        role: role || user.role || 'user',
        email: user.email,
        name: user.name,
        doc: user
      };

      return next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Token verification failed or expired'
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized: No Bearer token provided'
  });
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Usage: router.get('/admin-only', protect, requireRole('admin'), handler)
 * Usage: router.put('/doctor-or-admin', protect, requireRole('doctor', 'admin'), handler)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] permissions`
      });
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');

/**
 * Optional Authentication middleware: sets req.user if a valid token is present,
 * but allows the request to continue with req.user = null if no token is provided.
 */
export const optionalProtect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'sehatbuddy_super_secure_jwt_secret_dev_fallback_2026';
    const decoded = jwt.verify(token, secret);

    let user = null;
    let role = decoded.role;

    if (role === 'admin') {
      user = await Admin.findById(decoded.id);
    } else if (role === 'doctor') {
      user = await Doctor.findById(decoded.id);
    } else if (role === 'hospital') {
      user = await Hospital.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (user) {
      req.user = {
        id: user._id.toString(),
        role: role || user.role || 'user',
        email: user.email,
        name: user.name,
        doc: user
      };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }

  return next();
};
