"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export type Product = {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  rating: number;
  numReviews: number;
};

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();

  return (
    <Link href={`/product/${product._id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col h-full cursor-pointer">
        <div className="w-full aspect-square relative mb-4 bg-gray-50 rounded-md overflow-hidden">
          <Image
            src={product.image}
            alt={`Image of ${product.name} by ${product.brand}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        </div>

        <div className="flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-md font-semibold text-gray-900">{product.name}</h3>
            <span className="text-md font-semibold text-gray-800">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>

          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.image || "",
                quantity: 1,
              });
            }}
            className="mt-auto text-sm px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
