import express from "express"
import http from "http"
import { Server } from "socket.io"

const app = express() 
const server = http.createServer(app)

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173"

const io = new Server(server, {cors: {origin: [allowedOrigin]}})

function getReceiverSocketId(userId){
    return userSocketMap[userId]
}

const userSocketMap = {}

io.on("connection" ,(socket) =>{
    const userId = socket.handshake.auth.userId
    
    if (userId) userSocketMap[userId] = socket.id

    //io.emit sends event to everyone
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    //listening for a disconnect event
    socket.on("disconnect", () => {
        if (userId) delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

export {app, server, io, getReceiverSocketId}