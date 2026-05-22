import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Same logic as test.html, wrapped in a React hook
const useSocket = (serverUrl, sessionId) => {
    const [status, setStatus] = useState('connecting');
    const [receivedFiles, setReceivedFiles] = useState(null);
    const [roomMessage, setRoomMessage] = useState(null);

    useEffect(() => {
        if (!serverUrl || !sessionId) return;

        // 1. Connect to server (like: const socket = io("http://localhost:3000"))
        const socket = io(serverUrl);

        // 2. When connected, join the session room
        socket.on('connect', () => {
            setStatus('connected');
            socket.emit('join-session', sessionId);
        });

        // 3. Listen for server events
        socket.on('welcome', (msg) => {
            console.log(msg);
        });

        socket.on('room-joined', (msg) => {
            console.log(msg);
            setRoomMessage(msg);
        });

        socket.on('files-ready', (files) => {
            console.log('FILES RECEIVED:', files);
            setReceivedFiles((prev) => [...(prev || []), ...files]);
        });

        socket.on('disconnect', () => {
            setStatus('disconnected');
        });

        // 4. Cleanup when component unmounts
        return () => {
            socket.disconnect();
        };
    }, [serverUrl, sessionId]);

    return { status, receivedFiles, roomMessage };
};

export default useSocket;
