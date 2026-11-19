// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./lib/dbConnect.js";
import authRoutes from "./api/auth/userRoutes.js";
import productRoutes from "./api/auth/productRouters.js";
import orderRoutes from "./api/auth/orderRoutes.js";

dotenv.config({ quiet: true });
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB connection
connectDB();

// Routes
app.use("/api/user", authRoutes);
app.use("/api", productRoutes );
app.use("/api/orders", orderRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
