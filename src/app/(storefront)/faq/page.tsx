import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FaqPageContent from "@/components/faq/FaqPageContent";

export const metadata: Metadata = {
  title: "FAQ | Bespoken Fashion — Frequently Asked Questions",
  description:
    "Find answers to the most common questions about Bespoken Fashion — orders, shipping, returns, custom garments, sizing, payments, and more.",
};

export default function FaqPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <FaqPageContent />
      </main>
      <Footer />
    </>
  );
}
