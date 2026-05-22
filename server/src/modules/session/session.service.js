import Session from './session.model.js';

const createSession = async (sessionId) => {
    console.log('Creating session with ID:', sessionId);
  const session = new Session({ sessionId });
  return session.save();
};

const validateSession = async (sessionId) => {
  const session = await Session.findOne({ sessionId }).lean();
  return Boolean(session);
};

export { createSession, validateSession };
