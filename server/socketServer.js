import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

const server = http.createServer(app);
const io = new Server(server,{
        cors:{
            origin:"*",
        }
    });


    io.on("connection",(socket)=>{
        console.log("a user connected",socket.id);
        
        socket.on("join-session",(sessionId)=>{
            socket.join(sessionId);
            // console.log(`${socket.id} joined room ${sessionId}`);
            io.to(sessionId).emit("room-joined", `Joined rooms ${sessionId}`);
        })

        socket.on("disconnect",()=>{
            console.log("socket Disconnected...",socket.id)
        });

        socket.emit("welcome", "Backend connected successfully");
    })

export {server, io};