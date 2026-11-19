"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "../components/Loader";
import ProductCard, { Product } from "./ProductCard";


const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
        setSkip(0);
      } else {
        setLoadingMore(true);
      }
  
      const res = await axios.get<Product[]>(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/products`,
        {
          params: {
            skip: initial ? 0 : skip,
            limit,
          },
        }
      );
  
      if (initial) {
        setProducts(res.data);
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const newProducts = res.data.filter(
            (p: Product) => !existingIds.has(p._id)
          );
          return [...prev, ...newProducts];
        });
      }
  
      setSkip((prev) => (initial ? limit : prev + limit));
  
      // If we got fewer than limit, no more to load
      setHasMore(res.data.length === limit);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  
  
  useEffect(() => {
    fetchProducts(true);
  }, []);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        hasMore &&
        !loadingMore
      ) {
        fetchProducts(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore]);

  if (loading) {
     return <Loader text="Loading products..." />;

  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* Loading More Spinner */}
      {loadingMore && (
        <div className="text-center mt-6 text-gray-600">Loading more...</div>
      )}

      {/* No More Products */}
      {!hasMore && (
        <div className="text-center mt-6 text-gray-500">
          No more products to load.
        </div>
      )}
    </div>
  );
};

export default ProductList;
