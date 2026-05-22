# File Sharing Client — Line-by-Line Explanation

This document explains **every line** of the React client code used for:
- Creating a session (cookie + `sessionId`)
- Showing a QR code to share the session
- Uploading files to the backend (HTTP)
- Receiving files in real time (Socket.io)

Files covered (in order of execution flow):

1. `src/App.jsx` — root orchestrator  
2. `src/socket/socketClient.js` — low-level Socket.io helpers  
3. `src/hooks/useSocket.js` — React hook for socket lifecycle  
4. `src/components/SocketListener.jsx` — UI for real-time events  
5. `src/components/FileAttachComponent.jsx` — UI for file upload  
6. `src/components/QrComponents.jsx` — UI for QR sharing  
7. `test.html` — original socket test (reference)

---

## Architecture (big picture)

```
App.jsx
  ├── creates session (GET http://localhost:3000)
  ├── passes sessionId to children
  │
  ├── QrComponents        → shows QR with share URL
  ├── SocketListener        → useSocket → socketClient → Socket.io server
  └── FileAttachComponent   → axios POST /api/files/upload
```

**Separation of concerns:**
- **Upload** = HTTP only (`FileAttachComponent`)
- **Real-time** = Socket only (`SocketListener` + `useSocket` + `socketClient`)
- **Session** = created once in `App.jsx` and shared via props

---

# 1. `src/App.jsx`

```jsx
import { useState, useEffect } from 'react';
```
- **`import`** — brings code from another file into this file.
- **`useState`** — React hook to store data that can change (e.g. `sessionId`). When it changes, the component re-renders.
- **`useEffect`** — React hook to run side effects (API calls, subscriptions) after the component mounts.

```jsx
import axios from 'axios';
```
- **`axios`** — HTTP client library. Used to call your Express backend (`GET /`, `POST /api/files/upload`).

```jsx
import './App.css';
```
- Imports CSS styles for this app shell (Vite default styles).

```jsx
import QrComponents from './components/QrComponents.jsx';
import FileAttachComponent from './components/FileAttachComponent.jsx';
import SocketListener from './components/SocketListener.jsx';
```
- Imports three child components. Each handles **one job** (QR, upload, socket UI).

```jsx
const baseUrl = import.meta.env.VITE_BASE_URI;
```
- **`const`** — variable that cannot be reassigned.
- **`import.meta.env`** — Vite’s way to read environment variables from `.env`.
- **`VITE_BASE_URI`** — in your `.env` this is `"http://localhost:3000"` (backend URL).
- Only variables starting with `VITE_` are exposed to the browser.

```jsx
function App() {
```
- Declares the main React component function. This is what `main.jsx` renders.

```jsx
    const [sessionId, setSessionId] = useState(null);
```
- **`useState(null)`** — creates state named `sessionId`, initially `null`.
- **`setSessionId`** — function to update `sessionId`. Calling it triggers a re-render.
- **`null`** means “session not created yet”.

```jsx
    const [sessionError, setSessionError] = useState(null);
```
- Second state for error messages if session creation fails.
- Initially `null` (no error).

```jsx
    useEffect(() => {
```
- Runs the code inside **once** when `App` first appears on screen.
- Empty dependency array `[]` at the end means “do not run again on re-renders”.

```jsx
        const createSession = async () => {
```
- Defines an **async** function inside the effect (can use `await`).
- Named `createSession` for clarity.

```jsx
            try {
```
- Starts error handling: if anything below throws, jump to `catch`.

```jsx
                const response = await axios.get(baseUrl, { withCredentials: true });
```
- **`axios.get(baseUrl)`** — HTTP `GET` to `http://localhost:3000/` (your session route).
- **`await`** — waits until the server responds.
- **`withCredentials: true`** — tells the browser to send/receive **cookies** with the request.
  - Required because the server sets `sessionId` as an **httpOnly cookie** on this response.
  - Upload route (`tokenCheck`) reads that cookie to verify the session.

```jsx
                setSessionId(response.data.sessionId);
```
- Server responds with JSON like `{ "sessionId": "eyJhbG..." }`.
- **`response.data`** — parsed JSON body.
- **`setSessionId(...)`** — saves the ID in React state so children can use it.

```jsx
            } catch (error) {
```
- Runs if network fails, server is down, or server returns 4xx/5xx.

```jsx
                setSessionError('Could not connect to server. Is it running on port 3000?');
```
- Sets user-visible error message in state.

```jsx
                console.error(error);
```
- Logs full error in browser DevTools for debugging.

```jsx
            }
        };
```
- End of `try/catch` and end of `createSession` function definition.

```jsx
        createSession();
```
- Actually **calls** the function (defining it does not run it).

```jsx
    }, []);
```
- **`[]`** — dependency array empty = run effect only on mount.
- If you put `[baseUrl]` here, it would re-run if `baseUrl` changed.

```jsx
    return (
```
- JSX returned to the browser = what the user sees.

```jsx
        <>
```
- **React Fragment** — groups multiple elements without adding an extra `<div>` to the DOM.

```jsx
            {sessionError && <p style={{ color: 'red' }}>{sessionError}</p>}
```
- **`{sessionError && ...}`** — conditional render: only show `<p>` if `sessionError` is truthy.
- **`style={{ color: 'red' }}`**** — inline style object in React.

```jsx
            <QrComponents sessionId={sessionId} />
```
- Renders QR component.
- **`sessionId={sessionId}`** — passes state down as a **prop** named `sessionId`.

```jsx
            <SocketListener sessionId={sessionId} serverUrl={baseUrl} />
```
- Renders socket UI; needs both session ID and backend URL for Socket.io connection.

```jsx
            <FileAttachComponent sessionId={sessionId} baseUrl={baseUrl} />
```
- Renders upload form; needs session (for validation) and base URL (for POST).

```jsx
        </>
    );
}
```
- Closes fragment and component.

```jsx
export default App;
```
- **`export default`** — allows `main.jsx` to `import App from './App.jsx'`.

---

# 2. `src/socket/socketClient.js`

Pure JavaScript module — **no React**. Mirrors logic from `test.html` but reusable.

```js
import { io } from 'socket.io-client';
```
- **`io`** — factory function from Socket.io client library. Creates a WebSocket connection to the server.

```js
export const createSocket = (serverUrl) => io(serverUrl);
```
- **`export const`** — named export other files can import.
- **`createSocket`** — function name describing what it does.
- **`(serverUrl)`** — parameter, e.g. `"http://localhost:3000"`.
- **`io(serverUrl)`** — opens connection; does not connect until listeners are set (connects automatically).
- Same as `test.html` line: `const socket = io("http://localhost:3000");`

```js
export const joinSession = (socket, sessionId) => {
    socket.emit('join-session', sessionId);
};
```
- **`socket.emit(eventName, data)`** — sends event **to server**.
- **`'join-session'`** — must match server handler in `socketManager.js`.
- **`sessionId`** — JWT string; server does `socket.join(sessionId)` so all clients in that room get broadcasts.
- Same as `test.html` line: `socket.emit("join-session", "...token...");`

```js
export const attachSocketListeners = (socket, handlers = {}) => {
```
- Registers callbacks for server → client events.
- **`handlers = {}`** — default empty object if caller passes nothing.

```js
    const {
        onConnect,
        onWelcome,
        onRoomJoined,
        onFilesReady,
        onDisconnect,
        onConnectError,
    } = handlers;
```
- **Destructuring** — pulls named properties from `handlers` into local variables.
- Each is optional (may be `undefined`).

```js
    if (onConnect) socket.on('connect', onConnect);
```
- **`socket.on(event, callback)`** — listen for events from server (or internal connect).
- **`'connect'`** — fires when connection succeeds.
- Only registers if caller provided `onConnect` (avoids `socket.on('connect', undefined)`).

```js
    if (onWelcome) socket.on('welcome', onWelcome);
```
- Server emits `welcome` on connect (see `socketManager.js`: `socket.emit("welcome", "...")`).
- Same as `test.html`: `socket.on("welcome", (msg) => { ... })`

```js
    if (onRoomJoined) socket.on('room-joined', onRoomJoined);
```
- Server emits after you join a room: `io.to(sessionId).emit("room-joined", ...)`.

```js
    if (onFilesReady) socket.on('files-ready', onFilesReady);
```
- Server emits when upload completes: `io.to(req.sessionId).emit("files-ready", savedFiles)`.
- Payload = array of file metadata (name, downloadUrl, etc.).

```js
    if (onDisconnect) socket.on('disconnect', onDisconnect);
```
- Fires when connection drops.

```js
    if (onConnectError) socket.on('connect_error', onConnectError);
```
- Fires when connection cannot be established (server off, CORS, wrong URL).

```js
    return () => {
```
- Returns a **cleanup function** (used by `useSocket` on unmount).

```js
        if (onConnect) socket.off('connect', onConnect);
        ...
    };
```
- **`socket.off(event, sameCallback)`** — removes listeners. Prevents memory leaks and duplicate handlers if component remounts.

```js
export const disconnectSocket = (socket) => {
    socket.disconnect();
};
```
- Closes the WebSocket connection cleanly when leaving the page or React unmounts.

---

# 3. `src/hooks/useSocket.js`

React hook — connects `socketClient` to component state.

```js
import { useEffect, useState } from 'react';
```
- React hooks for state + lifecycle.

```js
import {
    attachSocketListeners,
    createSocket,
    disconnectSocket,
    joinSession,
} from '../socket/socketClient.js';
```
- Imports all socket helpers from the separate module (separation of concerns).

```js
const useSocket = (serverUrl, sessionId) => {
```
- Custom hook — convention: name starts with `use`.
- **`serverUrl`** — backend origin for Socket.io.
- **`sessionId`** — room to join after connect.

```js
    const [status, setStatus] = useState('connecting');
```
- UI string: `connecting` → `connected` → `disconnected` or `error`.

```js
    const [receivedFiles, setReceivedFiles] = useState(null);
```
- Holds latest `files-ready` payload from server; `null` until first receive.

```js
    const [roomMessage, setRoomMessage] = useState(null);
```
- Holds `room-joined` message string from server.

```js
    useEffect(() => {
        if (!serverUrl || !sessionId) return;
```
- Guard: do not open socket until both values exist (session still loading in `App`).

```js
        const socket = createSocket(serverUrl);
```
- One socket instance per effect run.

```js
        const detachListeners = attachSocketListeners(socket, {
```
- Passes an object of callbacks; receives cleanup function back.

```js
            onConnect: () => {
                setStatus('connected');
                joinSession(socket, sessionId);
            },
```
- On connect: update status, then tell server which session room to join.
- **Order matters:** join **after** connect (same pattern as `test.html`, though test.html emits join immediately — works if socket auto-connects).

```js
            onWelcome: (msg) => {
                console.log(msg);
            },
```
- Logs server welcome message (for debugging).

```js
            onRoomJoined: (msg) => {
                console.log(msg);
                setRoomMessage(msg);
            },
```
- Saves room confirmation for UI in `SocketListener`.

```js
            onFilesReady: (files) => {
                console.log('FILES RECEIVED:', files);
                setReceivedFiles(files);
            },
```
- When someone uploads files, server broadcasts to the room; this updates state so UI re-renders with download links.

```js
            onDisconnect: () => {
                setStatus('disconnected');
            },
```

```js
            onConnectError: () => {
                setStatus('error');
            },
```

```js
        });
```
- End of `attachSocketListeners` call.

```js
        return () => {
            detachListeners();
            disconnectSocket(socket);
        };
```
- **Cleanup on unmount** or when `serverUrl` / `sessionId` changes:
  - Remove all event listeners
  - Disconnect socket

```js
    }, [serverUrl, sessionId]);
```
- Re-run effect if URL or session changes (new session = new socket + new room).

```js
    return { status, receivedFiles, roomMessage };
};
```
- Hook’s public API — any component using `useSocket` gets these three values.

```js
export default useSocket;
```
- Default export for `import useSocket from '...'`

---

# 4. `src/components/SocketListener.jsx`

UI layer only — **no upload logic**, **no direct `io()` call**.

```jsx
import useSocket from '../hooks/useSocket.js';
```
- Uses the hook; does not import `socket.io-client` directly.

```jsx
const SocketListener = ({ sessionId, serverUrl }) => {
```
- Functional component.
- **`{ sessionId, serverUrl }`** — destructured **props** from parent (`App`).

```jsx
    const { status, receivedFiles, roomMessage } = useSocket(serverUrl, sessionId);
```
- Calls custom hook; subscribes to socket for this session.

```jsx
    if (!sessionId) {
        return <p>Waiting for session to connect socket...</p>;
    }
```
- Early return: avoid calling hook with missing session (hook already guards, but UI message is clearer).

```jsx
    return (
        <div className="socket-listener">
```
- Wrapper with CSS class for styling.

```jsx
            <h3>Live connection</h3>
            <p>Socket: {status}</p>
```
- Shows `connecting` / `connected` / etc.

```jsx
            {roomMessage && <p>{roomMessage}</p>}
```
- Shows server message after joining room, if any.

```jsx
            {receivedFiles && (
```
- Only render file list when `receivedFiles` is not null/empty.

```jsx
                <div>
                    <h4>Files received (real-time)</h4>
                    <ul>
                        {receivedFiles.map((file, index) => (
```
- **`.map()`** — loops array from server; returns JSX for each file.

```jsx
                            <li key={file.publicId || index}>
```
- **`key`** — React needs unique keys in lists; uses Cloudinary `publicId` or fallback `index`.

```jsx
                                <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                                    {file.originalName}
                                </a>
```
- **`downloadUrl`** — Cloudinary secure URL from backend.
- **`target="_blank"`** — open in new tab.
- **`rel="noreferrer"`** — security best practice for external links.

```jsx
export default SocketListener;
```

---

# 5. `src/components/FileAttachComponent.jsx`

HTTP upload only — **no Socket.io**.

```jsx
import { useState } from 'react';
import axios from 'axios';
```
- Only needs state hook and HTTP client (no `useEffect`).

```jsx
const FileAttachComponent = ({ sessionId, baseUrl }) => {
```

```jsx
    const [files, setFiles] = useState(null);
```
- Stores `FileList` from `<input type="file">` (browser object, not a plain array).

```jsx
    const [uploading, setUploading] = useState(false);
```
- `true` while POST is in progress — disables button, shows “Uploading...”.

```jsx
    const [uploadError, setUploadError] = useState(null);
```

```jsx
    const [uploadedFiles, setUploadedFiles] = useState(null);
```
- Result from **HTTP response** (not socket). Shown to uploader immediately.

```jsx
    const fileHandler = async (e) => {
        e.preventDefault();
```
- Form submit handler.
- **`preventDefault()`** — stops page reload on submit.

```jsx
        if (!files?.length) {
```
- **`?.`** optional chaining — safe if `files` is null.

```jsx
            setUploadError('Please select at least one file.');
            return;
```

```jsx
        if (!sessionId) {
            setUploadError('Session not ready. Please wait and try again.');
            return;
        }
```

```jsx
        const formData = new FormData();
```
- **`FormData`** — browser API for `multipart/form-data` uploads (required for files).

```jsx
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });
```
- **`Array.from(files)`** — converts `FileList` to array.
- **`append('files', file)`** — field name **`files`** must match server: `upload.array('files', 3)`.
- Can append up to 3 files (server limit).

```jsx
        setUploading(true);
        setUploadError(null);
        setUploadedFiles(null);
```
- Reset UI before new upload.

```jsx
        try {
            const response = await axios.post(`${baseUrl}/api/files/upload`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
```
- **`POST`** to upload route.
- **`withCredentials: true`** — sends `sessionId` cookie so `tokenCheck` middleware passes.
- **`Content-Type: multipart/form-data`** — tells server body contains files (axios sets boundary with FormData).

```jsx
            setUploadedFiles(response.data.files);
```
- Server returns `{ message, files }`; we use `files` array.

```jsx
        } catch (error) {
            const message = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Upload failed';
            setUploadError(message);
```
- Tries server error message first, then generic fallback.

```jsx
        } finally {
            setUploading(false);
        }
```
- **`finally`** — runs whether success or failure.

```jsx
    if (!sessionId) {
        return <p>Waiting for session...</p>;
    }
```

```jsx
    return (
        <div className="file-attach-component">
            <h3>Upload files</h3>
            <form onSubmit={fileHandler}>
```
- **`onSubmit={fileHandler}`** — runs handler on form submit (button click or Enter).

```jsx
                <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                />
```
- **`multiple`** — user can pick more than one file.
- **`e.target.files`** — `FileList` assigned to state.

```jsx
                <button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload files'}
                </button>
```
- **`disabled={uploading}`** — prevent double submit.
- Ternary in JSX for button label.

```jsx
            {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
```

```jsx
            {uploadedFiles && (
                ...
                        {uploadedFiles.map((file, index) => (
```
- Lists files returned by HTTP (uploader’s confirmation).

```jsx
export default FileAttachComponent;
```

**After successful upload on server:**
1. HTTP response → `FileAttachComponent` shows “Upload complete”
2. Server emits `files-ready` → `SocketListener` shows “Files received (real-time)” for everyone in the room

---

# 6. `src/components/QrComponents.jsx`

```jsx
import { QRCodeSVG } from 'qrcode.react';
```
- Component that renders QR code as SVG from a string `value`.

```jsx
const QrComponents = ({ sessionId }) => {
```

```jsx
    if (!sessionId) {
        return <p>Generating session...</p>;
    }
```
- Waits until `App` finishes `GET /` and passes `sessionId`.

```jsx
    const shareUrl = `${window.location.origin}?session=${encodeURIComponent(sessionId)}`;
```
- **`window.location.origin`** — e.g. `http://localhost:5173` (Vite dev server).
- **`?session=...`** — query param another device could read later (receiver flow — not fully implemented yet).
- **`encodeURIComponent(sessionId)`** — JWT contains characters that must be URL-encoded (`+`, `/`, `=`).

```jsx
    return (
        <div>
            <QRCodeSVG value={shareUrl} size={200} />
```
- QR encodes the full share URL; scanning opens your frontend with session in query string.

```jsx
            <p>Scan to join this session</p>
        </div>
    );
```

```jsx
export default QrComponents;
```

---

# 7. `test.html` (reference — original socket test)

```html
<!DOCTYPE html>
```
- HTML5 document type.

```html
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
```
- Loads Socket.io client from CDN (no npm). Exposes global `io`.

```html
const socket = io("http://localhost:3000");
```
- Connect to backend — same as `createSocket("http://localhost:3000")` in React.

```html
socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
});
```
- Logs socket id when connected.

```html
socket.emit("join-session", "eyJhbGci...");
```
- Hardcoded JWT for testing. In React, `sessionId` comes from API dynamically.

```html
socket.on("welcome", (msg) => { console.log(msg); });
socket.on("room-joined", (msg) => { console.log(msg); });
socket.on("files-ready", (files) => { console.log("FILES RECEIVED:", files); });
socket.on("disconnect", () => { console.log("Disconnected"); });
```
- Same events wired in `socketClient.js` / `useSocket.js`.

**Difference from React app:** `test.html` does everything in one `<script>` block. React splits into `socketClient` → `useSocket` → `SocketListener`.

---

# Environment & dependencies

| Item | Purpose |
|------|---------|
| `.env` → `VITE_BASE_URI=http://localhost:3000` | Backend URL for HTTP + Socket.io |
| `socket.io-client` (npm) | Required for `import { io } from 'socket.io-client'` |
| Server CORS `credentials: true` | Allows cookies from `localhost:5173` to `localhost:3000` |

Install if missing:
```bash
cd client
npm install socket.io-client
```

---

# Server events (backend reference)

| Event | Direction | When |
|-------|-----------|------|
| `connect` | client ↔ server | Connection established |
| `join-session` | client → server | Client sends `sessionId` |
| `room-joined` | server → client | After joining room |
| `welcome` | server → client | On connect |
| `files-ready` | server → client | After file upload completes |
| `disconnect` | client ↔ server | Connection closed |

---

# How to run & test

1. **Server:** `cd server` → `npm start` (port 3000, MongoDB + Cloudinary configured)
2. **Client:** `cd client` → `npm run dev` (port 5173)
3. Open app → session created → QR + socket connected + upload form ready
4. Upload files → see HTTP result in upload section + socket event in “Live connection”
5. Optional: open `test.html` in browser with a valid `sessionId` to test socket only

---

*End of line-by-line documentation.*
