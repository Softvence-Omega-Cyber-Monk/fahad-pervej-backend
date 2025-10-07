"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryUpload = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("./env");
cloudinary_1.v2.config({
    cloud_name: env_1.enVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.enVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: env_1.enVars.CLOUDINARY.CLOUDINARY_API_SECRET
});
exports.cloudinaryUpload = cloudinary_1.v2;
