import type { Metadata } from "next";
import ContactPageContent from "@/components/contact/ContactPageContent";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Bespokewala Fashion. Visit our Mumbai studio at Lotus Arc One, Andheri West, email us at info@bespokewala.com, or chat on WhatsApp for bridal consultations and custom orders.",
};

export default function ContactPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <ContactPageContent />
      </main>
          </>
  );
}
