import { Server } from "http";
import mongoose from "mongoose";
import app from "./app"


let server: Server;


const startServer = async () => {
    try {
        await mongoose.connect("mongodb+srv://tour_management:11A22b33c44D@cluster0.9o8rsbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log("Connected to DB");


        server = app.listen(5000, () => {
            console.log("Server is listening to port 5000");
        })
    }
    catch (err) {
        console.log(err)
    }
}

process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection Detected, Server is shutting down...", err);
    if(server){
        server.close(() => {
            process.exit(1)
        })
    }
    process.exit(1)
})

startServer();