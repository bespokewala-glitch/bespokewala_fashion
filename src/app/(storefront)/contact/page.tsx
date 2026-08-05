import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactPageContent from "@/components/contact/ContactPageContent";

export const metadata: Metadata = {
  title: "Contact Us | Bespoken Fashion — Mumbai Atelier",
  description:
    "Get in touch with Bespoken Fashion. Visit our Mumbai studio at Lotus Arc One, Andheri West, email us at bespokewala@gmail.com, or chat on WhatsApp for bridal consultations and custom orders.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <ContactPageContent />
      </main>
      <Footer />
    </>
  );
}
