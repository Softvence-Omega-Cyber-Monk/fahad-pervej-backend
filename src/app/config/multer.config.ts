// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { cloudinaryUpload } from "./cloudinary.config";
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinaryUpload,
//     params: {
//         public_id: (req, file) => {
//             const fileName = file.originalname.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "-").replace(/[^a-z0-9\-\.]/g,"");
//             const extensionName = file.originalname.split(".").pop()
//             const uniqueFileName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileName + "." + extensionName
//             return uniqueFileName
//         }
//     }
// })

// export const multerUpload = multer({storage : storage})

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";

// File filter for images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed image types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    // Allowed video types
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

    if (file.fieldname === 'video') {
        if (allowedVideoTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid video format. Only MP4, MPEG, MOV, and AVI are allowed'));
        }
    } else {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed'));
        }
    }
};

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryUpload,
    params: async (req, file) => {
        const fileName = file.originalname
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/\./g, "-")
            .replace(/[^a-z0-9\-]/g, "");
        
        const extensionName = file.originalname.split(".").pop();
        const uniqueFileName = 
            Math.random().toString(36).substring(2) + 
            "-" + 
            Date.now() + 
            "-" + 
            fileName;

        // Determine resource type and folder based on file type
        const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        const folder = `products/${resourceType}s`;

        return {
            folder: folder,
            public_id: uniqueFileName,
            resource_type: resourceType,
            allowed_formats: resourceType === 'video' 
                ? ['mp4', 'mpeg', 'mov', 'avi'] 
                : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        };
    }
});

export const multerUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for images
        files: 5 // Maximum 5 files
    }
});

// Separate multer instance for videos with larger file size
export const multerUploadVideo = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for videos
        files: 1
    }
});