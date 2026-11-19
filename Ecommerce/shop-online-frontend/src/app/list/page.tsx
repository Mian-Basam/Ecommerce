"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Loader from "../components/Loader";
import ProductCard, { Product } from "../components/ProductCard";

const PAGE_SIZE = 12;
const API = process.env.NEXT_PUBLIC_API_BASE;

// /list                       -> all products (the "Shop" page)
// /list?name=watch            -> search results
// /list?category=bags         -> one category
// /list?name=red&category=makeup
const ListPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get("name") || "").trim();
  const category = (searchParams.get("category") || "").trim();

  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get<string[]>(`${API}/api/products/categories`)
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  // (Re)load the first page whenever the search or category changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    axios
      .get<Product[]>(`${API}/api/products`, {
        params: { search: query || undefined, category: category || undefined, skip: 0, limit: PAGE_SIZE },
      })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data);
        setHasMore(res.data.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load products. Is the backend running?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, category]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await axios.get<Product[]>(`${API}/api/products`, {
        params: {
          search: query || undefined,
          category: category || undefined,
          skip: products.length,
          limit: PAGE_SIZE,
        },
      });
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [...prev, ...res.data.filter((p) => !seen.has(p._id))];
      });
      setHasMore(res.data.length === PAGE_SIZE);
    } catch {
      setError("Could not load more products.");
    } finally {
      setLoadingMore(false);
    }
  };

  const setCategory = (next: string) => {
    const params = new URLSearchParams();
    if (query) params.set("name", query);
    if (next) params.set("category", next);
    const qs = params.toString();
    router.push(qs ? `/list?${qs}` : "/list");
  };

  const heading = query ? `Results for "${query}"` : category ? "" : "All products";

  return (
    <div className="pt-28 pb-16 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {heading || <span className="capitalize">{category}</span>}
          </h1>
          {!loading && !error && (
            <p className="text-sm text-gray-500 mt-1">
              {products.length}
              {hasMore ? "+" : ""} {products.length === 1 ? "product" : "products"}
              {query && category ? ` in ${category}` : ""}
            </p>
          )}
        </div>
        {query && (
          <button
            onClick={() => router.push(category ? `/list?category=${encodeURIComponent(category)}` : "/list")}
            className="text-sm text-gray-600 hover:underline self-start md:self-auto"
          >
            Clear search ✕
          </button>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {["", ...categories].map((c) => {
            const active = c.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={c || "all"}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-sm border capitalize transition ${
                  active
                    ? "bg-black text-white border-black"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {c || "All"}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <Loader text="Loading products..." />
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-gray-700">No products found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try a different search term or category.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// useSearchParams() must be inside a Suspense boundary for `next build`.
const ListPage = () => (
  <Suspense fallback={<Loader text="Loading products..." />}>
    <ListPageContent />
  </Suspense>
);

export default ListPage;
