import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SizeGuideContent from "@/components/size-guide/SizeGuideContent";

export const metadata: Metadata = {
  title: "Size Guide | Bespoken Fashion",
  description:
    "Find your perfect fit with Bespoken Fashion's comprehensive size guide. Detailed measurement charts for lehengas, sarees, kurtis, blouses, sherwanis, suits, and accessories.",
};

export default function SizeGuidePage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <SizeGuideContent />
      </main>
      <Footer />
    </>
  );
}
