import { Request, Response } from "express";
import { userService } from "./user.service";

export class UserController {
  async registerCustomer(req: Request, res: Response) {
    try {
      const { user, token } = await userService.registerCustomer(req.body);
      res.status(201).json({ success: true, message: "Customer registered successfully", data: { user, token } });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async registerVendor(req: Request, res: Response) {
    try {
      const { user, token } = await userService.registerVendor(req.body);
      res.status(201).json({
        success: true,
        message: "Vendor registered successfully. Please wait for admin verification.",
        data: { user, token },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { user, token } = await userService.login(email, password);
      res.json({ success: true, message: "Login successful", data: { user, token } });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
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
      const userId = (req as any).user.id || (req as any).user.id;
      const user = await userService.getUserById(userId);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const updatedUser = await userService.updateUser(userId, req.body);
      res.json({ success: true, message: "Profile updated successfully", data: updatedUser });
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
