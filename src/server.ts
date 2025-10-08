// import { Server } from "http";
// import mongoose from "mongoose";
// import app from "./app"
// import { enVars } from "./app/config/env";


// let server: Server;
// const PORT = enVars.PORT || 5000


// const startServer = async () => {
//     try {
//         await mongoose.connect("mongodb+srv://tour_management:11A22b33c44D@cluster0.9o8rsbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
//         console.log("Connected to DB");


//         server = app.listen(PORT, () => {
//             console.log("Server is listening to port 5000");
//         })
//     }
//     catch (err) {
//         console.log(err)
//     }
// }

// process.on("unhandledRejection", (err) => {
//     console.log("Unhandled Rejection Detected, Server is shutting down...", err);
//     if(server){
//         server.close(() => {
//             process.exit(1)
//         })
//     }
//     process.exit(1)
// })

// startServer();

import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import app from "./app";
import { enVars } from "./app/config/env";
import { initializeChatSocket } from "./app/modules/chat/socket.handler";
import { ChatRoute } from "./app/modules/chat/chat.route";

const PORT = enVars.PORT || 5000
const httpServer = createServer(app)

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: "*", // Change this to your frontend domain in production
        methods: ["GET", "POST"],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
})

app.set("io", io);

const startServer = async () => {
    try {
        await mongoose.connect(
            "mongodb+srv://tour_management:11A22b33c44D@cluster0.9o8rsbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        );
        console.log("✅ Connected to MongoDB");
        initializeChatSocket(io)
        app.use("/api/v1/chat", ChatRoute)
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 Socket.IO ready for connections`);
        });
    }
    catch (err) {
        console.error("❌ Failed to start server:", err);
    }
}

process.on("unhandledRejection", (err) => {
    console.log("💥 Unhandled Rejection, shutting down...", err);
    httpServer.close(() => {
        process.exit(1);
    });
});

startServer()
export {io}