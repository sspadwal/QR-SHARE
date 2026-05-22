export const getServerUrl = () => {
    const fromEnv = import.meta.env.VITE_BASE_URI;
    if (!fromEnv) {
        console.error('Error: VITE_BASE_URI is not defined in environment variables.');
    }
    return (fromEnv || '').replace(/\/$/, '');
};

export const getShareUrl = (sessionId) => {
    const origin = import.meta.env.VITE_CLIENT_URL || window.location.origin;
    const path = window.location.pathname || '/';
    return `${origin.replace(/\/$/, '')}${path}?session=${encodeURIComponent(sessionId)}`;
};
