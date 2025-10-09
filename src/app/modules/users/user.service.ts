import { UserModel } from "./user.model";
import { IUser } from "./user.interface";
import jwt from "jsonwebtoken";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
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

  async registerVendor(payload: Partial<IUser>): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    payload.role = "VENDOR";
    payload.isVerified = false;
    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) throw new Error("Email already exists");

    const user = new UserModel(payload);
    await user.save();

    const { accessToken, refreshToken } = this.generateTokens(user.id.toString(), user.role);
    return { user, accessToken, refreshToken };
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
      
      // Verify user still exists and is active
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
    return vendor.save();
  }

  async getAllVendors(): Promise<IUser[]> {
    return UserModel.find({ role: "VENDOR" });
  }

  async getAllCustomers(): Promise<IUser[]> {
    return UserModel.find({ role: "CUSTOMER" });
  }

  async getUserById(userId: string): Promise<IUser | null> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUser(userId: string, payload: Partial<IUser>): Promise<IUser | null> {
    // Prevent role or sensitive changes via this method
    delete payload.role;
    delete payload.isVerified;
    const updatedUser = await UserModel.findByIdAndUpdate(userId, payload, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
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

  // ================== TOKEN HELPERS ==================
  private generateAccessToken(id: string, role: string): string {
    const secret = process.env.JWT_SECRET || "secretkey";
    return jwt.sign({ id, role }, secret, { expiresIn: "15m" }); // 15 minutes
  }

  private generateRefreshToken(id: string, role: string): string {
    const secret = process.env.JWT_REFRESH_SECRET || "refresh_secretkey";
    return jwt.sign({ id, role }, secret, { expiresIn: "7d" }); // 7 days
  }

  private generateTokens(id: string, role: string): TokenPair {
    return {
      accessToken: this.generateAccessToken(id, role),
      refreshToken: this.generateRefreshToken(id, role),
    };
  }
}

export const userService = new UserService();
