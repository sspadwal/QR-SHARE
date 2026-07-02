import { useState, useEffect } from 'react';
import './App.css';
import { getServerUrl } from './utils/config.js';
import LaptopPage from './pages/LaptopPage.jsx';
import MobileUploadPage from './pages/MobileUploadPage.jsx';
import { Analytics } from '@vercel/analytics/react';

const baseUrl = getServerUrl();

function App() {
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get('session');

    // Retrieve theme from localStorage or default to system preference/light
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    });

    // Apply data-theme attribute to document element
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <>
            <Analytics />
            {sessionFromUrl ? (
                <MobileUploadPage sessionId={sessionFromUrl} baseUrl={baseUrl} theme={theme} toggleTheme={toggleTheme} />
            ) : (
                <LaptopPage baseUrl={baseUrl} theme={theme} toggleTheme={toggleTheme} />
            )}
        </>
    );
}

export default App;
