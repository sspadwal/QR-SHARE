import { generateSessionId } from '../../common/utils/generateSessionId.js';
import { createSession, validateSession } from './session.service.js';

const createSessionHandler = async (req, res) => {
  try {
    const sessionId = generateSessionId();
    await createSession(sessionId);
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 1000 * 60 * 60 * 24,
    });
    return res.status(201).json({ sessionId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create session' });
  }
};

const validateSessionHandler = async (req, res) => {
  const sessionId = req.query.sessionId || req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(400).json({ valid: false, message: 'Session id is required' });
  }

  try {
    const valid = await validateSession(String(sessionId));
    return res.json({ valid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ valid: false, message: 'Validation failed' });
  }
};

export { createSessionHandler, validateSessionHandler };
