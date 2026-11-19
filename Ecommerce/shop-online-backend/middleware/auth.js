// middleware/auth.js - verifies the "Authorization: Bearer <jwt>" header
import jwt from "jsonwebtoken";
import User from "../models/Users.js";

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Please log in first" });
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
};
