import { validateSession } from '../session/session.service.js';

const tokenCheck = async (req, res, next) => {
    // Prioritize explicit header 'x-session-id' (passed by the React app) over cookies (which can be stale)
    const sessionId = req.headers['x-session-id'] || req.cookies.sessionId;

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