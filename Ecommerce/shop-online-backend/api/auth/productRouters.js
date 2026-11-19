// routes/productRoutes.js
import express from "express";
import Product from "../../models/Product.js";
import Review from "../../models/Review.js";
import Deal from "../../models/Deal.js";

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/products/categories - distinct product categories
router.get("/products/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ error: "Error fetching categories" });
  }
});


router.get("/products", async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    // Optional filters: ?search=<text> matches name/brand/category/description,
    // ?category=<name> matches the category exactly (case-insensitive).
    const filter = {};
    const search = String(req.query.search || "").trim();
    if (search) {
      const re = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: re }, { brand: re }, { category: re }, { description: re }];
    }
    const category = String(req.query.category || "").trim();
    if (category) {
      filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    }

    const products = await Product.find(filter)
    .sort({ createdAt: -1, _id: -1 }) 
    .skip(skip)
    .limit(limit);

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

router.get("/products/deals", async (req, res) => {
  try {
    const deals = await Deal.find(); 

    // Ensure numbers are sent as actual numbers
    const formattedDeals = deals.map((deal) => ({
      _id: deal._id,
      name: deal.name,
      price: Number(deal.originalPrice) || 0,  // ensure number
      dealPrice: Number(deal.dealPrice) || 0,  // ensure number
      image: deal.image,
      stock: deal.stock || 10,                  // default if not present
      brand: deal.brand,
      category: deal.category,
      description: deal.description,
      discountPercentage: Number(deal.discountPercentage) || 0,
      isActive: deal.isActive
    }));

    res.json(formattedDeals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch deals" });
  }
});


// GET /api/products/:id - single product with reviews
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await Review.find({ productId: req.params.id })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.json({ product, reviews });
  } catch (error) {
    console.error("Error fetching product", error);
    res.status(500).json({ message: "Server error" });
  }
});


// POST /api/products/:id/reviews
router.post("/products/:id/reviews", async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  try {
    // 1️⃣ Save new review
    const review = new Review({
      userId: req.user?._id || null, // if you have auth middleware
      productId,
      rating,
      comment,
    });

    await review.save();

    // 2️⃣ Recalculate product average rating
    const reviews = await Review.find({ productId });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // 3️⃣ Update product rating & numReviews
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: reviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error adding review", error);
    res.status(500).json({ message: "Server error" });
  }
});





export default router;




