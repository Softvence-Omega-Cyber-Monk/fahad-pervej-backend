import { v2 as cloudinary } from "cloudinary";
import { enVars } from "./env";

cloudinary.config({
    cloud_name: enVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: enVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: enVars.CLOUDINARY.CLOUDINARY_API_SECRET
})

export const cloudinaryUpload = cloudinary
