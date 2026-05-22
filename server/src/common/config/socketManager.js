import { Server } from "socket.io";

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
        }
    });

    io.on("connection", (socket) => {
        console.log("a user connected:", socket.id);

        socket.emit("welcome", "Backend connected successfully");

        socket.on("join-session", (sessionId) => {
            socket.join(sessionId);
            console.log(`${socket.id} joined ${sessionId}`);

            io.to(sessionId).emit("room-joined", `Joined room ${sessionId}`);
        });

        socket.on("disconnect", () => {
            console.log("socket disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

export { initSocket, getIO };