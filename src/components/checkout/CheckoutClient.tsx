"use client";

import React, { useState, useEffect } from "react";
import { useCart, CartItem } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useRouter } from "next/navigation";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { event as fbEvent } from "@/components/MetaPixel";
import { trackBeginCheckout, trackAddShippingInfo, trackAddPaymentInfo } from "@/lib/gtag";

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

  // Address Book State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressValidationMsg, setAddressValidationMsg] = useState<string | null>(null);
  const [suggestedAddress, setSuggestedAddress] = useState<any>(null);

  const [shippingDetails, setShippingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "", // Used for razorpay prefill
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phone: "",
    isDefault: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { formatPrice, currency, rates } = useCurrency();
  const subtotal = cartTotal;
  const shippingCost: number = 0; // subtotal > 10000 ? 0 : 500;
  const total = subtotal + shippingCost;

  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
    
    // Track InitiateCheckout (Meta Pixel)
    if (cart.length > 0) {
      fbEvent("InitiateCheckout", {
        content_ids: cart.map(item => item.productSlug),
        content_type: "product",
        value: total,
        currency: "INR",
        num_items: cart.reduce((sum, item) => sum + item.quantity, 0)
      });

      // GA4 begin_checkout
      trackBeginCheckout(cart, total);
    }
  }, []);

  // Fetch saved addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch('/api/account/addresses');
        if (res.ok) {
          const data = await res.json();
          const addrs = data.addresses || [];
          setSavedAddresses(addrs);
          
          if (addrs.length > 0) {
            const defaultAddr = addrs.find((a: any) => a.isDefault) || addrs[0];
            setSelectedAddressId(defaultAddr._id);
          } else {
            setShowAddressForm(true);
          }
        } else {
          setShowAddressForm(true);
        }
      } catch (err) {
        console.error(err);
        setShowAddressForm(true);
      } finally {
        setIsFetchingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setShippingDetails((prev) => ({ ...prev, [name]: checked }));
    } else {
        setShippingDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveAddress = async () => {
    if (!shippingDetails.firstName || !shippingDetails.lastName || !shippingDetails.address || !shippingDetails.city || !shippingDetails.state || !shippingDetails.zipCode || !shippingDetails.phone) {
      setError("Please fill out all required address fields.");
      return;
    }

    setIsSavingAddress(true);
    setError(null);
    setAddressValidationMsg(null);
    
    try {
      // 1. Validate Address via API
      const valRes = await fetch('/api/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          zipCode: shippingDetails.zipCode,
          country: shippingDetails.country
        })
      });
      const valData = await valRes.json();
      
      if (!valData.isValid) {
        setError(valData.message || "Please enter a valid address.");
        setIsSavingAddress(false);
        return;
      }
      
      if (valData.message && valData.isValid) {
         // E.g. "Address verification is temporarily unavailable"
         setAddressValidationMsg(valData.message);
      }

      if (valData.suggestedAddress && !suggestedAddress) {
        setSuggestedAddress(valData.suggestedAddress);
        setError("We've standardized your address for better delivery. Please review and click Save again to confirm.");
        setShippingDetails(prev => ({
          ...prev,
          address: valData.suggestedAddress.address || prev.address,
          city: valData.suggestedAddress.city || prev.city,
          state: valData.suggestedAddress.state || prev.state,
          zipCode: valData.suggestedAddress.zipCode || prev.zipCode
        }));
        setIsSavingAddress(false);
        return;
      }

      // 2. Save Address
      const url = editingAddressId 
        ? `/api/account/addresses/${editingAddressId}`
        : `/api/account/addresses`;
      const method = editingAddressId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shippingDetails)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to save address");
      
      setSavedAddresses(data.addresses);
      
      if (!editingAddressId && data.addresses.length > 0) {
          const newAddr = data.addresses[data.addresses.length - 1];
          setSelectedAddressId(newAddr._id);
      } else if (editingAddressId) {
          setSelectedAddressId(editingAddressId);
      }

      setShowAddressForm(false);
      setEditingAddressId(null);
      setShippingDetails({
        firstName: "", lastName: "", email: "", address: "", city: "", state: "", zipCode: "", country: "India", phone: "", isDefault: false
      });

      // GA4 add_shipping_info — fires after user successfully saves/confirms a shipping address
      trackAddShippingInfo(cart, total);
      setSuggestedAddress(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleEditAddress = (addr: any) => {
    setShippingDetails({
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",
      email: addr.email || "", 
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      zipCode: addr.zipCode || "",
      country: addr.country || "India",
      phone: addr.phone || "",
      isDefault: addr.isDefault || false
    });
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(data.addresses);
        if (selectedAddressId === id) {
          const newDefault = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
          setSelectedAddressId(newDefault ? newDefault._id : null);
          if (data.addresses.length === 0) setShowAddressForm(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayWithRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) { setError("Your cart is empty"); return; }
    
    let finalShippingDetails = shippingDetails;
    
    if (showAddressForm) {
      setError("Please save your shipping address first.");
      return;
    }
    
    if (savedAddresses.length > 0) {
      const selectedAddr = savedAddresses.find(a => a._id === selectedAddressId);
      if (!selectedAddr) {
        setError("Please select a shipping address.");
        return;
      }
      finalShippingDetails = { ...selectedAddr, email: shippingDetails.email || "" };
    }

    if (!scriptLoaded || !window.Razorpay) {
      setError("Payment gateway is loading, please try again in a moment.");
      return;
    }

    setLoading(true);
    setError(null);

    // Track AddPaymentInfo (user submitted details and proceeded to payment)
    fbEvent("AddPaymentInfo", {
      content_ids: cart.map(item => item.productSlug),
      content_type: "product",
      value: total,
      currency: "INR"
    });

    // GA4 add_payment_info
    trackAddPaymentInfo(cart, total, 'Razorpay');

    try {
      // Step 1: Create Razorpay order on server
      const orderRes = await fetch("/api/orders/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR", shippingDetails: finalShippingDetails }),
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
            name: `${finalShippingDetails.firstName} ${finalShippingDetails.lastName}`.trim(),
            email: finalShippingDetails.email, // Can be empty, Razorpay will ask
            contact: finalShippingDetails.phone,
          },
          notes: {
            address: finalShippingDetails.address,
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
                  shippingDetails: finalShippingDetails,
                  displayCurrency: currency,
                  exchangeRate: rates[currency] || 1,
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
      {addressValidationMsg && !error && (
        <div style={{ backgroundColor: "#fff3e0", color: "#e65100", padding: "1rem", marginBottom: "2rem", textAlign: "center", border: "1px solid #ffcc80" }}>
          {addressValidationMsg}
        </div>
      )}

      <form onSubmit={handlePayWithRazorpay} style={{ display: "flex", flexWrap: "wrap", gap: "2rem 4rem", alignItems: "flex-start" }}>
        {/* Shipping Form / Address Book */}
        <div style={{ flex: "1 1 400px", minWidth: 0 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 400, letterSpacing: "0.1em", marginBottom: "2rem", textTransform: "uppercase", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
            Shipping Address
          </h2>

          {isFetchingAddresses ? (
            <p style={{ color: "#888", fontSize: "0.9rem" }}>Loading addresses...</p>
          ) : (
            <>
              {!showAddressForm && savedAddresses.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "1.5rem" }}>Saved Addresses</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {savedAddresses.map(addr => (
                      <div 
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        style={{
                          padding: "1.5rem",
                          border: selectedAddressId === addr._id ? "2px solid #000" : "1px solid #e0e0e0",
                          backgroundColor: selectedAddressId === addr._id ? "#fafafa" : "#fff",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s"
                        }}
                      >
                        {addr.isDefault && (
                          <span style={{ position: "absolute", top: "1.5rem", right: "1.5rem", fontSize: "0.7rem", backgroundColor: "#000", color: "#fff", padding: "0.2rem 0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Default</span>
                        )}
                        <div style={{ fontWeight: 500, marginBottom: "0.5rem", fontSize: "1.1rem" }}>{addr.firstName} {addr.lastName}</div>
                        <div style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.6 }}>
                          {addr.address}<br/>
                          {addr.city}, {addr.state} {addr.zipCode}<br/>
                          {addr.country}<br/>
                          Phone: {addr.phone}
                        </div>
                        
                        <div style={{ marginTop: "1rem", display: "flex", gap: "1.5rem" }}>
                           <button type="button" onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }} style={{ background: "none", border: "none", padding: 0, color: "#666", textDecoration: "underline", cursor: "pointer", fontSize: "0.85rem" }}>Edit</button>
                           <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }} style={{ background: "none", border: "none", padding: 0, color: "#c62828", textDecoration: "underline", cursor: "pointer", fontSize: "0.85rem" }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingAddressId(null);
                      setShippingDetails({ firstName: "", lastName: "", email: "", address: "", city: "", state: "", zipCode: "", country: "India", phone: "", isDefault: false });
                      setShowAddressForm(true);
                    }}
                    style={{ marginTop: "2rem", background: "none", border: "1px solid #000", padding: "1rem 2rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem", width: "100%", transition: "background 0.2s" }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {(showAddressForm || savedAddresses.length === 0) && (
                <div style={{ padding: savedAddresses.length > 0 ? "2rem" : "0", backgroundColor: savedAddresses.length > 0 ? "#fafafa" : "transparent", border: savedAddresses.length > 0 ? "1px solid #eee" : "none" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 400, marginBottom: "1.5rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h3>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    <input type="text" name="firstName" placeholder="First Name" value={shippingDetails.firstName} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
                    <input type="text" name="lastName" placeholder="Last Name" value={shippingDetails.lastName} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <input type="text" name="address" placeholder="Address (Street, Apartment, Suite)" value={shippingDetails.address} onChange={handleChange} style={inputStyle} />
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    <input type="text" name="city" placeholder="City" value={shippingDetails.city} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
                    <input type="text" name="state" placeholder="State / Province" value={shippingDetails.state} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    <input type="text" name="zipCode" placeholder="Postal Code / ZIP" value={shippingDetails.zipCode} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }} />
                    <select name="country" value={shippingDetails.country} onChange={handleChange} style={{ ...inputStyle, flex: "1 1 200px" }}>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <input type="tel" name="phone" placeholder="Phone Number" value={shippingDetails.phone} onChange={handleChange} style={inputStyle} />
                  </div>
                  
                  {/* Keep email for Razorpay if no addresses exist or they want to fill it, though it's optional */}
                  {savedAddresses.length === 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <input type="email" name="email" placeholder="Email Address (Optional)" value={shippingDetails.email} onChange={handleChange} style={inputStyle} />
                    </div>
                  )}

                  <div style={{ marginBottom: "2rem" }}>
                     <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "0.9rem", color: "#555" }}>
                       <input type="checkbox" name="isDefault" checked={shippingDetails.isDefault} onChange={handleChange} style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }} />
                       Set as default address
                     </label>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button 
                      type="button" 
                      onClick={handleSaveAddress}
                      disabled={isSavingAddress}
                      style={{ backgroundColor: "#000", color: "#fff", border: "none", padding: "1rem 2rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem", flex: 1 }}
                    >
                      {isSavingAddress ? "Saving..." : suggestedAddress ? "Confirm & Save" : "Save Address"}
                    </button>
                    
                    {savedAddresses.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => {
                           setShowAddressForm(false);
                           setEditingAddressId(null);
                           setSuggestedAddress(null);
                           setError(null);
                        }}
                        style={{ backgroundColor: "transparent", color: "#000", border: "1px solid #ccc", padding: "1rem 2rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem", flex: 1 }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div style={{ backgroundColor: "#f9f9f9", padding: "2.5rem", width: "100%", boxSizing: "border-box", flex: "1 1 300px", minWidth: 0 }} className="mobile-m-0 mobile-p-4 desktop-sticky">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 400, letterSpacing: "0.1em", marginBottom: "2rem", textTransform: "uppercase" }}>
            Order Summary
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
            {cart.map((item: CartItem, idx: number) => (
              <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ position: "relative", width: "60px", height: "80px", flexShrink: 0, backgroundColor: "#eee" }}>
                  <OptimizedImage src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} variant="thumbnail" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 400, margin: 0 }}>{item.name}</h4>
                  {item.size && <span style={{ fontSize: "0.8rem", color: "#666" }}>Size: {item.size}</span>}
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontSize: "0.875rem" }}>{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "1.5rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.9rem" }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.9rem" }}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 400 }}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <div style={{ padding: "1rem", backgroundColor: "#fff", border: "1px solid #e0e0e0", borderLeft: "3px solid #d2b48c", marginBottom: "1.5rem", fontSize: "0.78rem", color: "#555", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: "#1c1c1c", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>⏱️ Estimated Delivery Timelines:</div>
            • <strong>Footwear Collection:</strong> 15 to 20 Days<br />
            • <strong>Couture &amp; Bespoke:</strong> 40–50 days<br />
            • <strong>Standard Ready-to-Wear:</strong> 3–7 days
          </div>

          <button
            type="submit"
            disabled={loading || !scriptLoaded || isFetchingAddresses}
            style={{
              width: "100%",
              padding: "1.2rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "0.9rem",
              cursor: loading || !scriptLoaded || isFetchingAddresses ? "not-allowed" : "pointer",
              opacity: loading || !scriptLoaded || isFetchingAddresses ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Processing..." : currency === "INR" ? `Pay ₹${total.toLocaleString("en-IN")} with Razorpay` : `Pay ₹${total.toLocaleString("en-IN")} (~${formatPrice(total)}) with Razorpay`}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#999", marginTop: "1rem" }}>
            🔒 Secured by Razorpay
          </p>
        </div>
      </form>
    </div>
  );
}
