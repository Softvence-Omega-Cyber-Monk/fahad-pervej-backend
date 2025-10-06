import { UserModel } from "./user.model";
import { IUser } from "./user.interface";

export class UserService {
  async registerCustomer(payload: Partial<IUser>): Promise<{ user: IUser; token: string }> {
    payload.role = "CUSTOMER";
    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) throw new Error("Email already exists");

    const user = new UserModel(payload);
    await user.save();

    const token = this.generateToken(user.id.toString(), user.role);
    return { user, token };
  }

  async registerVendor(payload: Partial<IUser>): Promise<{ user: IUser; token: string }> {
    payload.role = "VENDOR";
    payload.isVerified = false;
    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) throw new Error("Email already exists");

    const user = new UserModel(payload);
    await user.save();

    const token = this.generateToken(user.id.toString(), user.role);
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid email or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error("Invalid email or password");

    if (user.role === "VENDOR" && !user.isVerified)
      throw new Error("Your vendor profile is pending admin verification");

    const token = this.generateToken(user.id.toString(), user.role);
    user.password = ""; // remove password from response
    return { user, token };
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

  // ================== HELPER METHOD ==================
  private generateToken(id: string, role: string): string {
    const secret = process.env.JWT_SECRET || "secretkey";
    return require("jsonwebtoken").sign({ id, role }, secret, { expiresIn: "7d" });
  }
}

export const userService = new UserService();
