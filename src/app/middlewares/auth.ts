import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const secret = process.env.JWT_SECRET || "secretkey";
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};
