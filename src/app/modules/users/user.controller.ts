import { CookieOptions, Request, Response } from "express";
import { userService } from "./user.service";

// Cookie configuration helper function
const getCookieOptions = (maxAge: number): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: maxAge,
  };
};

export class UserController {
  async registerCustomer(req: Request, res: Response) {
    try {
      const { user, accessToken, refreshToken } = await userService.registerCustomer(req.body);

      // Set tokens in cookies
      res.cookie("accessToken", accessToken, getCookieOptions(24 * 60 * 60 * 1000)); // 1 day
      res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

      res.status(201).json({
        success: true,
        message: "Customer registered successfully",
        data: { user, accessToken, refreshToken }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async registerVendor(req: Request, res: Response) {
    try {
      // Extract files from multer
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[]
      };

      const vendorFiles = {
        CRDocuments: files?.CRDocuments?.[0],
        vendorSignature: files?.vendorSignature?.[0],
        vendorContract: files?.vendorContract?.[0],
      };

      // Parse form data
      const formData = { ...req.body };
      
      // Handle productCategory array - MongoDB ObjectIds
      if (req.body['productCategory[]']) {
        let categories = req.body['productCategory[]'];
        
        // If it's a string (JSON), parse it
        if (typeof categories === 'string') {
          try {
            categories = JSON.parse(categories);
          } catch (e) {
            // If parsing fails, treat it as a single value
            categories = [categories];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(categories)) {
          categories = [categories];
        }
        
        // Validate that these are valid ObjectIds (24 character hex strings)
        // Filter out any non-ObjectId values like 'consumables'
        formData.productCategory = categories.filter((id: string) => {
          const isValid = /^[0-9a-fA-F]{24}$/.test(id);
          if (!isValid) {
            console.warn(`Skipping invalid category ID: ${id}`);
          }
          return isValid;
        });
        
        console.log('Product Categories:', formData.productCategory);
      }
      
      // Handle shippingLocation array
      if (req.body['shippingLocation[]']) {
        formData.shippingLocation = Array.isArray(req.body['shippingLocation[]'])
          ? req.body['shippingLocation[]']
          : [req.body['shippingLocation[]']];
        
        console.log('Shipping Locations:', formData.shippingLocation);
      }

      // Parse originAddress from JSON string
      if (req.body.originAddress) {
        try {
          formData.originAddress = JSON.parse(req.body.originAddress);
          console.log('Origin Address:', formData.originAddress);
        } catch (parseError) {
          console.error('Failed to parse originAddress:', parseError);
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid origin address format' 
          });
        }
      }

      // Convert string booleans to actual booleans
      if (formData.isPrivacyPolicyAccepted !== undefined) {
        formData.isPrivacyPolicyAccepted = formData.isPrivacyPolicyAccepted === 'true';
      }
      if (formData.isSellerPolicyAccepted !== undefined) {
        formData.isSellerPolicyAccepted = formData.isSellerPolicyAccepted === 'true';
      }

      console.log('Registration Data:', {
        name: formData.name,
        email: formData.email,
        businessName: formData.businessName,
        originAddress: formData.originAddress,
        productCategories: formData.productCategory?.length || 0,
        shippingLocations: formData.shippingLocation?.length || 0,
        files: {
          CRDocuments: vendorFiles.CRDocuments?.originalname,
          vendorSignature: vendorFiles.vendorSignature?.originalname,
          vendorContract: vendorFiles.vendorContract?.originalname,
        }
      });

      const { user, accessToken, refreshToken } = await userService.registerVendor(
        formData,
        vendorFiles
      );

      // Set tokens in cookies
      res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000)); // 15 minutes
      res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

      res.status(201).json({
        success: true,
        message: "Vendor registered successfully. Please wait for admin verification.",
        data: { user, accessToken, refreshToken },
      });
    } catch (error: any) {
      console.error('Vendor registration error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await userService.login(email, password);

      // Set tokens in cookies
      res.cookie("accessToken", accessToken, getCookieOptions(60 * 60 * 1000)); // 1 hour
      res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

      res.json({
        success: true,
        message: "Login successful",
        data: { user, accessToken, refreshToken }
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ success: false, message: "Refresh token not provided" });
      }

      const { accessToken } = await userService.refreshAccessToken(refreshToken);

      // Set new access token in cookie
      res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000)); // 15 minutes

      res.json({
        success: true,
        message: "Access token refreshed successfully",
        data: { accessToken }
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyVendor(req: Request, res: Response) {
    try {
      const vendorId = req.params.id;
      const vendor = await userService.verifyVendor(vendorId);
      res.json({ success: true, message: "Vendor verified successfully", data: vendor });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllVendors(req: Request, res: Response) {
    try {
      const vendors = await userService.getAllVendors();
      res.json({ success: true, data: vendors });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPendingVendors(req: Request, res: Response) {
    try {
      const pendingVendors = await userService.getPendingVendors();
      res.json({ success: true, data: pendingVendors });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPendingVendorById(req: Request, res: Response) {
    try {
      const vendorId = req.params.id;
      const vendor = await userService.getPendingVendorById(vendorId);
      res.json({ success: true, data: vendor });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await userService.getAllCustomers();
      res.json({ success: true, data: customers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const user = await userService.getUserById(userId);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      // Extract files from multer
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[]
      };

      const imageFiles = {
        profileImage: files?.profileImage,
        storeBanner: files?.storeBanner,
      };

      const updatedUser = await userService.updateUser(userId, req.body, imageFiles);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "New password and confirm password do not match"
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long"
        });
      }

      await userService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: "Password changed successfully"
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deactivateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const { reason } = req.body;
      const user = await userService.deactivateUser(userId, reason);
      res.json({ success: true, message: "User deactivated successfully", data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      await userService.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const userController = new UserController();