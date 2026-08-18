import type { Metadata } from "next";
import FaqPageContent from "@/components/faq/FaqPageContent";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Find answers to the most common questions about Bespokewala Fashion — orders, shipping, returns, custom garments, sizing, payments, and more.",
};

export default function FaqPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <FaqPageContent />
      </main>
          </>
  );
}
