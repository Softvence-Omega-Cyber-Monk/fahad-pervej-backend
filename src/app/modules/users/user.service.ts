import { UserModel } from "./user.model";
import { IUser } from "./user.interface";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../../../utils/cloudinaryUpload";
import fs from "fs";
import { vendorEmailService } from "./vendor.email.service";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface VendorFiles {
  CRDocuments?: Express.Multer.File;
  vendorSignature?: Express.Multer.File;
  vendorContract?: Express.Multer.File;
}

export class UserService {
  async registerCustomer(payload: Partial<IUser>): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    payload.role = "CUSTOMER";
    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) throw new Error("Email already exists");

    const user = new UserModel(payload);
    await user.save();

    const { accessToken, refreshToken } = this.generateTokens(user.id.toString(), user.role);
    return { user, accessToken, refreshToken };
  }

  async registerVendor(
    payload: Partial<IUser>,
    files: VendorFiles
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    try {
      payload.role = "VENDOR";
      payload.isVerified = false;
      
      const existingUser = await UserModel.findOne({ email: payload.email });
      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Validate required files
      if (!files.CRDocuments) {
        throw new Error("CR Documents are required");
      }
      if (!files.vendorSignature) {
        throw new Error("Vendor signature is required");
      }
      if (!files.vendorContract) {
        throw new Error("Vendor contract is required");
      }

      console.log("📤 Starting parallel file uploads...");

      // ✅ UPLOAD ALL FILES IN PARALLEL (much faster!)
      const [crDocumentsUrl, signatureUrl, contractUrl] = await Promise.all([
        uploadToCloudinary(files.CRDocuments.path, "vendors/cr-documents"),
        uploadToCloudinary(files.vendorSignature.path, "vendors/signatures"),
        uploadToCloudinary(files.vendorContract.path, "vendors/contracts")
      ]);

      payload.CRDocuments = crDocumentsUrl;
      payload.vendorSignature = signatureUrl;
      payload.vendorContract = contractUrl;

      console.log("✅ All files uploaded successfully");

      // Create user in database
      const user = new UserModel(payload);
      await user.save();

      console.log("✅ Vendor registered in database");

      // Clean up temp files after successful upload
      this.cleanupTempFiles(files);

      // Send pending approval email (don't wait for it)
      vendorEmailService.sendVendorRegistrationPendingEmail(
        user.email,
        user.name,
        user.businessName || 'Your Business'
      ).catch(err => {
        console.error("Failed to send registration pending email:", err);
      });

      const { accessToken, refreshToken } = this.generateTokens(user.id.toString(), user.role);
      return { user, accessToken, refreshToken };
      
    } catch (error) {
      console.error("🔥 Vendor registration error:", error);
      
      // Clean up temp files on error
      this.cleanupTempFiles(files);
      
      // Re-throw with appropriate message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to register vendor. Please try again.");
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFiles(files: VendorFiles): void {
    const filesToClean = [
      files.CRDocuments?.path,
      files.vendorSignature?.path,
      files.vendorContract?.path,
    ];

    filesToClean.forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up temp file: ${filePath}`);
        } catch (unlinkError) {
          console.error(`Failed to delete temp file ${filePath}:`, unlinkError);
        }
      }
    });
  }

  async login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid email or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error("Invalid email or password");

    if (user.role === "VENDOR" && !user.isVerified)
      throw new Error("Your vendor profile is pending admin verification");

    const { accessToken, refreshToken } = this.generateTokens(user.id.toString(), user.role);
    user.password = ""; // remove password from response
    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const secret = process.env.JWT_REFRESH_SECRET || "refresh_secretkey";
      const decoded = jwt.verify(refreshToken, secret) as { id: string; role: string };

      const user = await UserModel.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      const accessToken = this.generateAccessToken(decoded.id, decoded.role);
      return { accessToken };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  async verifyVendor(vendorId: string): Promise<IUser | null> {
    const vendor = await UserModel.findById(vendorId);
    if (!vendor) throw new Error("Vendor not found");
    
    vendor.isVerified = true;
    await vendor.save();

    console.log("✅ Vendor verified successfully");

    // Send approval email (don't wait for it)
    vendorEmailService.sendVendorApprovedEmail(
      vendor.email,
      vendor.name,
      vendor.businessName || 'Your Business'
    ).catch(err => {
      console.error("Failed to send vendor approved email:", err);
    });

    return vendor;
  }

  async getAllVendors(): Promise<IUser[]> {
    return UserModel.find({ role: "VENDOR" });
  }

  async getPendingVendors(): Promise<IUser[]> {
    return UserModel.find({ role: "VENDOR", isVerified: false });
  }

  async getPendingVendorById(vendorId: string): Promise<IUser | null> {
    const vendor = await UserModel.findOne({
      _id: vendorId,
      role: "VENDOR",
      isVerified: false
    });

    if (!vendor) {
      throw new Error("Pending vendor not found");
    }

    return vendor;
  }

  async getAllCustomers(): Promise<IUser[]> {
    return UserModel.find({ role: "CUSTOMER" });
  }

  async getUserById(userId: string): Promise<IUser | null> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUser(
    userId: string,
    payload: Partial<IUser>,
    files?: {
      profileImage?: Express.Multer.File[];
      storeBanner?: Express.Multer.File[];
    }
  ): Promise<IUser | null> {
    try {
      delete payload.role;
      delete payload.isVerified;

      // ✅ Upload images in parallel if both exist
      const uploadPromises: Promise<string>[] = [];
      
      if (files?.profileImage && files.profileImage.length > 0) {
        uploadPromises.push(
          uploadToCloudinary(files.profileImage[0].path, "users/profiles")
        );
      }

      if (files?.storeBanner && files.storeBanner.length > 0) {
        uploadPromises.push(
          uploadToCloudinary(files.storeBanner[0].path, "users/store-banners")
        );
      }

      if (uploadPromises.length > 0) {
        const uploadedUrls = await Promise.all(uploadPromises);
        let urlIndex = 0;
        
        if (files?.profileImage && files.profileImage.length > 0) {
          payload.profileImage = uploadedUrls[urlIndex++];
        }
        if (files?.storeBanner && files.storeBanner.length > 0) {
          payload.storeBanner = uploadedUrls[urlIndex++];
        }
      }

      if (payload.categories && typeof payload.categories === 'string') {
        try {
          payload.categories = JSON.parse(payload.categories as string);
        } catch (e) {
          payload.categories = [payload.categories as unknown as string];
        }
      }

      if (payload.holdingTime !== undefined) {
        const holdingTime = Number(payload.holdingTime);
        if (isNaN(holdingTime) || holdingTime < 0) {
          throw new Error("Invalid holding time value");
        }
        payload.holdingTime = holdingTime;
      }

      const updatedUser = await UserModel.findByIdAndUpdate(userId, payload, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) throw new Error("User not found");
      return updatedUser;
    } catch (error) {
      if (files?.profileImage?.[0]?.path && fs.existsSync(files.profileImage[0].path)) {
        fs.unlinkSync(files.profileImage[0].path);
      }
      if (files?.storeBanner?.[0]?.path && fs.existsSync(files.storeBanner[0].path)) {
        fs.unlinkSync(files.storeBanner[0].path);
      }
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await UserModel.findById(userId).select("+password");
    if (!user) throw new Error("User not found");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new Error("Current password is incorrect");

    user.password = newPassword;
    await user.save();
  }

  async deactivateUser(userId: string, reason?: string): Promise<IUser | null> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    user.isActive = false;
    if (reason) user.deactivationReason = reason;

    return user.save();
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    await UserModel.findByIdAndDelete(userId);
  }

  private generateAccessToken(id: string, role: string): string {
    const secret = process.env.JWT_SECRET || "secretkey";
    return jwt.sign({ id, role }, secret, { expiresIn: "15m" });
  }

  private generateRefreshToken(id: string, role: string): string {
    const secret = process.env.JWT_REFRESH_SECRET || "refresh_secretkey";
    return jwt.sign({ id, role }, secret, { expiresIn: "7d" });
  }

  private generateTokens(id: string, role: string): TokenPair {
    return {
      accessToken: this.generateAccessToken(id, role),
      refreshToken: this.generateRefreshToken(id, role),
    };
  }
}

export const userService = new UserService();