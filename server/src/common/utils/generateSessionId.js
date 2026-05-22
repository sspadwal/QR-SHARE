import jwt from 'jsonwebtoken';
export const generateSessionId = () => {
    const sessionId = jwt.sign({}, process.env.SECRET_KEY, { expiresIn: '15m' });
    return sessionId;
};