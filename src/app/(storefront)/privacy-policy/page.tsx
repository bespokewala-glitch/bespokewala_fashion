import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PrivacyPolicyContent from "@/components/legal/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | Bespoken Fashion",
  description:
    "Read Bespoken Fashion's Privacy Policy to understand how we collect, use, and protect your personal information when you shop with us.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <PrivacyPolicyContent />
      </main>
      <Footer />
    </>
  );
}
