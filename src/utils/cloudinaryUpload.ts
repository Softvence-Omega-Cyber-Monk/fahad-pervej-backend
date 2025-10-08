import { cloudinary } from "../app/config/cloudinary.config";
import fs from "fs";

export const uploadToCloudinary = async (
  localPath: string,
  folder: string = "products"
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder,
      resource_type: "auto", // auto = handles both images & videos
    });

    fs.unlinkSync(localPath); // Delete temp file
    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    console.error("Cloudinary upload failed:", error);
    throw error;
  }
};
