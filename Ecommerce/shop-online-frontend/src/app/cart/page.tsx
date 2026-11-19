"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext, useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

type PlacedOrder = { _id: string; totalPrice: number };

const emptyAddress = { address: "", city: "", postalCode: "", country: "" };

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal, cartCount } =
    useCart();
  const { isLoggedIn } = useContext(UserContext);

  const [shipping, setShipping] = useState(emptyAddress);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to place your order");
      return;
    }

    setPlacing(true);
    try {
      const res = await axios.post<PlacedOrder>(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/orders`,
        {
          items: cartItems.map(({ id, quantity }) => ({ id, quantity })),
          shippingAddress: shipping,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlacedOrder(res.data);
      clearCart({ silent: true });
      setShipping(emptyAddress);
      toast.success("Order placed!");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Could not place your order");
    } finally {
      setPlacing(false);
    }
  };

  const wrapper = "pt-28 pb-16 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 min-h-screen";

  if (placedOrder) {
    return (
      <div className={wrapper}>
        <div className="max-w-lg mx-auto text-center bg-white rounded-xl shadow-sm p-10">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Thank you for your order!</h1>
          <p className="text-gray-600">
            Order <span className="font-mono text-sm">#{placedOrder._id.slice(-8)}</span> ·
            Total ${placedOrder.totalPrice.toFixed(2)}
          </p>
          <p className="text-gray-500 text-sm mt-2">Payment: cash on delivery.</p>
          <Link
            href="/list"
            className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-900"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={wrapper}>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Find something you like and add it to your cart.</p>
          <Link
            href="/list"
            className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-900"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const field = (key: keyof typeof emptyAddress, label: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        required
        value={shipping[key]}
        onChange={(e) => setShipping((s) => ({ ...s, [key]: e.target.value }))}
        className="border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-black"
      />
    </label>
  );

  return (
    <div className={wrapper}>
      <h1 className="text-3xl font-bold mb-8">
        Your Cart <span className="text-lg text-gray-500 font-normal">({cartCount} items)</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Items */}
        <div className="flex-1 flex flex-col gap-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 bg-white rounded-xl shadow-sm p-4">
              <Image
                src={item.image || "/product.png"}
                alt={item.name}
                width={96}
                height={120}
                className="object-cover rounded-md w-24 h-30"
              />
              <div className="flex flex-col justify-between flex-1">
                <div className="flex justify-between gap-4">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span className="font-semibold whitespace-nowrap">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center border border-gray-300 rounded-full">
                    <button
                      className="px-4 py-1 hover:bg-gray-100 rounded-l-full"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>
                    <span className="px-3 min-w-8 text-center">{item.quantity}</span>
                    <button
                      className="px-4 py-1 hover:bg-gray-100 rounded-r-full"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-sm text-red-500 hover:underline"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            className="self-start text-sm text-red-500 hover:underline"
            onClick={() => confirm("Clear your cart?") && clearCart()}
          >
            Clear cart
          </button>
        </div>

        {/* Summary + checkout */}
        <form
          onSubmit={handleCheckout}
          className="lg:w-96 bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 h-fit"
        >
          <h2 className="text-xl font-semibold">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-3">
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <h3 className="font-semibold mt-2">Shipping address</h3>
          {field("address", "Street address")}
          <div className="grid grid-cols-2 gap-3">
            {field("city", "City")}
            {field("postalCode", "Postal code")}
          </div>
          {field("country", "Country")}
          <p className="text-xs text-gray-500">Payment: cash on delivery.</p>

          {isLoggedIn ? (
            <button
              type="submit"
              disabled={placing}
              className="rounded-md py-3 bg-black text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {placing ? "Placing order..." : "Place order"}
            </button>
          ) : (
            <Link
              href="/login"
              className="text-center rounded-md py-3 bg-black text-white hover:bg-gray-900"
            >
              Log in to check out
            </Link>
          )}
        </form>
      </div>
    </div>
  );
};

export default CartPage;
