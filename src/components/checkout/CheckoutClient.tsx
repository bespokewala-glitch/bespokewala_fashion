"use client";

import React, { useState, useEffect } from "react";
import { useCart, CartItem } from "@/context/CartContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutClient() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const [shippingDetails, setShippingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartTotal;
  const shippingCost: number = 0; // subtotal > 10000 ? 0 : 500;
  const total = subtotal + shippingCost;

  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayWithRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) { setError("Your cart is empty"); return; }
    if (!scriptLoaded || !window.Razorpay) {
      setError("Payment gateway is loading, please try again in a moment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create Razorpay order on server
      const orderRes = await fetch("/api/orders/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR" }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || "Failed to create payment order");

      const { razorpayOrderId, amount: rzpAmount, currency } = orderData;

      // Step 2: Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpAmount,
          currency,
          name: "Bespokewala",
          description: "Luxury Fashion Purchase",
          image: "/bespoken-transparent.png",
          order_id: razorpayOrderId,
          prefill: {
            name: `${shippingDetails.firstName} ${shippingDetails.lastName}`.trim(),
            email: shippingDetails.email,
            contact: shippingDetails.phone,
          },
          notes: {
            address: shippingDetails.address,
          },
          theme: { color: "#000000" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Step 3: Verify payment & create order in DB
              const verifyRes = await fetch("/api/orders/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  items: cart.map((item: CartItem) => ({
                    productSlug: item.productSlug,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    size: item.size,
                  })),
                  shippingDetails,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed");

              clearCart();
              router.push(`/checkout/success?orderId=${verifyData.orderId}`);
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          reject(new Error(response.error?.description || "Payment failed"));
        });
        rzp.open();
      });

    } catch (err: any) {
      if (err.message !== "Payment cancelled") {
        setError(err.message || "Payment failed. Please try again.");
      }
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 300, marginBottom: "1rem", letterSpacing: "0.1em" }}>
          Your Cart is Empty
        </h2>
        <p style={{ color: "#666", marginBottom: "2rem" }}>Add some items to proceed to checkout.</p>
        <button
          onClick={() => router.push("/products")}
          style={{
            padding: "1rem 3rem",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "1rem",
    border: "1px solid #e0e0e0",
    backgroundColor: "#fafafa",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }} className="mobile-px-4">
      <h1 style={{ fontSize: "2rem", fontWeight: 300, letterSpacing: "0.1em", marginBottom: "3rem", textTransform: "uppercase", textAlign: "center" }}>
        Checkout
      </h1>

      {error && (
        <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "1rem", marginBottom: "2rem", textAlign: "center" }}>
          {error}
        </div>
      )}

      <form onSubmit={handlePayWithRazorpay} style={{ display: "flex", flexWrap: "wrap", gap: "4rem", alignItems: "flex-start" }}>
        {/* Shipping Form */}
        <div style={{ flex: "1 1 400px", minWidth: 0 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 400, letterSpacing: "0.1em", marginBottom: "2rem", textTransform: "uppercase", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
            Shipping Details
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <input required type="text" name="firstName" placeholder="First Name" value={shippingDetails.firstName} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
            <input required type="text" name="lastName" placeholder="Last Name" value={shippingDetails.lastName} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <input required type="email" name="email" placeholder="Email Address" value={shippingDetails.email} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <input required type="text" name="address" placeholder="Address (Street, Apartment, Suite)" value={shippingDetails.address} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <input required type="text" name="city" placeholder="City" value={shippingDetails.city} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
            <input required type="text" name="state" placeholder="State / Province" value={shippingDetails.state} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <input required type="text" name="zipCode" placeholder="Postal Code / ZIP" value={shippingDetails.zipCode} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
            <select name="country" value={shippingDetails.country} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }}>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <input required type="tel" name="phone" placeholder="Phone Number" value={shippingDetails.phone} onChange={handleChange} style={inputStyle} />
          </div>

          {/* Payment Section */}
          <h2 style={{ fontSize: "1.25rem", fontWeight: 400, letterSpacing: "0.1em", marginBottom: "2rem", textTransform: "uppercase", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
            Payment
          </h2>

          <div style={{ padding: "1.5rem", border: "1px solid #e0e0e0", backgroundColor: "#fafafa", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#072654"/>
              <path d="M17.5 8L10 18h7l-2.5 6L22 14h-7l2.5-6z" fill="#3395FF"/>
            </svg>
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.95rem", letterSpacing: "0.05em" }}>Pay with Razorpay</div>
              <div style={{ color: "#666", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                Cards, UPI, Net Banking, Wallets &amp; more — Secure &amp; encrypted
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div style={{ backgroundColor: "#f9f9f9", padding: "2.5rem", width: "100%", boxSizing: "border-box", flex: "1 1 300px", minWidth: 0 }} className="mobile-m-0 mobile-p-4 desktop-sticky">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 400, letterSpacing: "0.1em", marginBottom: "2rem", textTransform: "uppercase" }}>
            Order Summary
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
            {cart.map((item: CartItem, idx: number) => (
              <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "60px", height: "80px", flexShrink: 0, backgroundColor: "#eee" }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 400, margin: 0 }}>{item.name}</h4>
                  {item.size && <span style={{ fontSize: "0.8rem", color: "#666" }}>Size: {item.size}</span>}
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontSize: "0.875rem" }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "1.5rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.9rem" }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.9rem" }}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "Free" : `₹${shippingCost.toLocaleString("en-IN")}`}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 400 }}>
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>

          <button
            type="submit"
            disabled={loading || !scriptLoaded}
            style={{
              width: "100%",
              padding: "1.2rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "0.9rem",
              cursor: loading || !scriptLoaded ? "not-allowed" : "pointer",
              opacity: loading || !scriptLoaded ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Processing..." : `Pay ₹${total.toLocaleString("en-IN")} with Razorpay`}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#999", marginTop: "1rem" }}>
            🔒 Secured by Razorpay
          </p>
        </div>
      </form>
    </div>
  );
}
