import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TermsConditionsContent from "@/components/legal/TermsConditionsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions | Bespoken Fashion",
  description:
    "Read Bespoken Fashion's Terms & Conditions governing the use of our website and the purchase of our products.",
};

export default function TermsConditionsPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <TermsConditionsContent />
      </main>
      <Footer />
    </>
  );
}
