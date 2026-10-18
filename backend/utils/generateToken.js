import jwt from 'jsonwebtoken';

const generateToken = (id, role = 'user') => {
  const secret = process.env.JWT_SECRET || (
    process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('FATAL: JWT_SECRET environment variable is missing in production'); })()
      : 'sehatbuddy_super_secure_jwt_secret_dev_fallback_2026'
  );
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

export default generateToken;
