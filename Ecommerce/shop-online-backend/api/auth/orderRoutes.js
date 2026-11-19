// routes/orderRoutes.js - checkout
import express from "express";
import mongoose from "mongoose";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Deal from "../../models/Deal.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

// POST /api/orders  (auth required)
// Body: { items: [{ id, quantity }], shippingAddress: { address, city, postalCode, country } }
// Prices are looked up on the server (product price, or dealPrice for deals),
// so the client can't change what it pays.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress = {} } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }
    const { address, city, postalCode, country } = shippingAddress;
    if (![address, city, postalCode, country].every((v) => String(v || "").trim())) {
      return res.status(400).json({ message: "Please fill in the full shipping address" });
    }

    const orderItems = [];
    for (const item of items) {
      const quantity = parseInt(item.quantity);
      if (!mongoose.isValidObjectId(item.id) || !(quantity >= 1)) {
        return res.status(400).json({ message: "Invalid cart item" });
      }

      const product = await Product.findById(item.id);
      if (product) {
        if (product.stock < quantity) {
          return res
            .status(400)
            .json({ message: `Only ${product.stock} left of ${product.name}` });
        }
        orderItems.push({ productId: product._id, quantity, price: product.price });
        continue;
      }

      const deal = await Deal.findById(item.id);
      if (deal && deal.isActive) {
        orderItems.push({ productId: deal._id, quantity, price: deal.dealPrice });
        continue;
      }

      return res.status(400).json({ message: "An item in your cart is no longer available" });
    }

    const totalPrice =
      Math.round(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      shippingAddress: { address, city, postalCode, country },
      paymentMethod: "Cash on delivery",
      totalPrice,
    });

    // Reduce stock for regular products
    await Promise.all(
      orderItems.map((i) =>
        Product.updateOne({ _id: i.productId }, { $inc: { stock: -i.quantity } })
      )
    );

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/orders/mine  (auth required) - the logged-in user's orders, newest first
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
