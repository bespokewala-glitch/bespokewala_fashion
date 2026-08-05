import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShippingPageContent from "@/components/shipping/ShippingPageContent";

export const metadata: Metadata = {
  title: "Shipping & Returns | Bespoken Fashion",
  description:
    "Learn about Bespoken Fashion's shipping options, delivery timelines, return policy, and how to track your order. Free shipping on orders above ₹15,000 within India.",
};

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <ShippingPageContent />
      </main>
      <Footer />
    </>
  );
}
