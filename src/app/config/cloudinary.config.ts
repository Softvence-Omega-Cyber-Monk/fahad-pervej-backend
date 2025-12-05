import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

// Validate environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true, // Force HTTPS URLs
});


export { cloudinary };