import cloudinaryImport from "cloudinary";
import { enVars } from "./env";

const cloudinary = cloudinaryImport as any; // bypass TS type error

cloudinary.config({
    cloud_name: enVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: enVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: enVars.CLOUDINARY.CLOUDINARY_API_SECRET,
});

export const cloudinaryUpload = cloudinary;
