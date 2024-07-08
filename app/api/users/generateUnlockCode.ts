import crypto from 'crypto';

export const generateUnlockCode = () => crypto.randomBytes(32).toString('hex');
