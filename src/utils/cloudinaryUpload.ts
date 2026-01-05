import { cloudinary } from "../app/config/cloudinary.config";
import fs from "fs";
import path from "path";
import { UploadApiOptions, UploadApiResponse } from "cloudinary";

/**
 * Enhanced Cloudinary upload with proper PDF and image handling
 */
export const uploadToCloudinary = async (
  localPath: string,
  folder: string = "products"
): Promise<string> => {
  try {
    // Verify Cloudinary is configured
    const config = cloudinary.config();
    if (!config.api_key || !config.cloud_name) {
      throw new Error("Cloudinary is not properly configured. Please check your environment variables.");
    }

    // Check if file exists
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${localPath}`);
    }

    // Get file info
    const fileExtension = path.extname(localPath).toLowerCase();
    const fileName = path.basename(localPath, fileExtension);
    
    console.log(`📤 Uploading file: ${fileName}${fileExtension} to folder: ${folder}`);

    // Determine file type and set appropriate options
    const uploadOptions = getUploadOptions(fileExtension, folder, fileName);

    // Upload to Cloudinary
    const result: UploadApiResponse = await cloudinary.uploader.upload(
      localPath, 
      uploadOptions
    );

    console.log(`✅ Upload successful: ${result.secure_url}`);

    // Delete temp file after successful upload
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    return result.secure_url;
    
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (unlinkError) {
        console.error("Failed to delete temp file:", unlinkError);
      }
    }
    
    console.error("❌ Cloudinary upload failed:", error);
    
    // Handle specific errors
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes("api_key") || error.message.includes("Invalid API Key")) {
        throw new Error("Cloudinary API key is missing or invalid. Check your .env file.");
      }
      
      if (error.message.includes("File not found")) {
        throw error;
      }
      
      if (error.message.includes("File size too large")) {
        throw new Error("File size exceeds Cloudinary limits. Please use a smaller file.");
      }
      
      if (error.message.includes("q_auto") || error.message.includes("transformation")) {
        throw new Error("File format not compatible with transformations. Uploading as raw file.");
      }
      
      // Re-throw with original message
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
    
    throw new Error("Failed to upload to Cloudinary");
  }
};

/**
 * Get appropriate upload options based on file type
 */
function getUploadOptions(
  fileExtension: string, 
  folder: string, 
  fileName: string
): UploadApiOptions {
  const baseOptions: UploadApiOptions = {
    folder,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  // PDF files - upload as raw
  if (fileExtension === '.pdf') {
    return {
      ...baseOptions,
      resource_type: 'raw',
      format: 'pdf',
      // Don't apply any transformations to PDFs
    };
  }

  // Image files - can apply optimizations
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension)) {
    return {
      ...baseOptions,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
      // Optional: Add image transformations
      // transformation: [
      //   { quality: 'auto' },
      //   { fetch_format: 'auto' }
      // ]
    };
  }

  // Video files
  if (['.mp4', '.mov', '.avi', '.webm'].includes(fileExtension)) {
    return {
      ...baseOptions,
      resource_type: 'video',
      quality: 'auto',
    };
  }

  // Default - upload as raw for unknown types
  return {
    ...baseOptions,
    resource_type: 'raw',
  };
}

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    
    return result.result === 'ok';
  } catch (error) {
    console.error("Failed to delete from Cloudinary:", error);
    return false;
  }
};

/**
 * Extract public ID from Cloudinary URL
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload/' and before the file extension
    const pathAfterUpload = parts.slice(uploadIndex + 1).join('/');
    const publicId = pathAfterUpload.split('.')[0];
    
    // Remove version if present (v1234567890)
    return publicId.replace(/\/v\d+\//, '/');
  } catch (error) {
    console.error("Failed to extract public ID:", error);
    return null;
  }
};

/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleToCloudinary = async (
  files: { path: string; folder: string }[]
): Promise<string[]> => {
  const uploadPromises = files.map(file => 
    uploadToCloudinary(file.path, file.folder)
  );
  
  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Failed to upload multiple files:", error);
    throw error;
  }
};