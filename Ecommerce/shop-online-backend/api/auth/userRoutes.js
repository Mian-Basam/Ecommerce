// routes/auth.js
import express from "express";
import User from "../../models/Users.js";
import jwt from "jsonwebtoken";


const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request received");
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });
    console.log("User created with ID:", user._id);

    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// Login Route
// POST /api/user/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Optional: Return user info (without password)
    const { _id, name, role } = user;

    res.status(200).json({
      message: "Login successful",
      token,
      user: { _id, name, email, role },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
