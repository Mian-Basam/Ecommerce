"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

const CartModal = ({ onClose }: { onClose?: () => void }) => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal, cartCount } =
    useCart();
  const router = useRouter();

  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      clearCart();
    }
  };

  const goToCart = () => {
    onClose?.();
    router.push("/cart");
  };

  return (
    <div
      className="w-[90vw] max-w-md absolute p-4 rounded-md shadow-lg bg-white top-14 right-0 flex flex-col gap-6 z-50 border border-gray-100 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      {cartItems.length === 0 ? (
        <div className="text-gray-500 text-center py-10">Your cart is empty.</div>
      ) : (
        <>
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xl font-semibold">
              Shopping Cart <span className="text-sm text-gray-500">({cartCount})</span>
            </h2>
            <button className="text-sm text-red-500 hover:underline" onClick={handleClearCart}>
              Clear Cart
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div className="flex gap-4" key={item.id}>
                <Image
                  src={item.image || "/product.png"}
                  alt={item.name}
                  width={72}
                  height={96}
                  className="object-cover rounded-md w-[72px] h-[96px]"
                />
                <div className="flex flex-col justify-between w-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <div className="text-sm bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <div className="flex items-center border border-gray-300 rounded-full">
                      <button
                        className="px-3 py-0.5 hover:bg-gray-100 rounded-l-full"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="px-2 min-w-6 text-center">{item.quantity}</span>
                      <button
                        className="px-3 py-0.5 hover:bg-gray-100 rounded-r-full"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Bottom */}
          <div>
            <div className="flex justify-between font-semibold text-base">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-gray-500 text-sm mt-2 mb-4">
              Shipping and taxes calculated at checkout.
            </p>
            <div className="flex justify-between text-sm gap-2">
              <button
                className="w-1/2 rounded-md py-3 px-4 border border-gray-300 hover:bg-gray-50"
                onClick={goToCart}
              >
                View Cart
              </button>
              <button
                className="w-1/2 rounded-md py-3 px-4 bg-black text-white hover:bg-gray-900"
                onClick={goToCart}
              >
                Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartModal;
