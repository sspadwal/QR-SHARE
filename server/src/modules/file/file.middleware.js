import { validateSession } from '../session/session.service.js';

const tokenCheck = async (req, res, next) => {
    const sessionId = req.cookies.sessionId || req.headers['x-session-id'];

    if (!sessionId) {
        return res.status(401).json({ message: 'Session id is Required' });
    }

    const valid = await validateSession(sessionId);
    if (!valid) {
        return res.status(401).json({ message: 'Invalid session id' });
    }

    req.sessionId = sessionId;
    next();
};

export { tokenCheck };