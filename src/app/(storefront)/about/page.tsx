import type { Metadata } from "next";
import AboutPageContent from "@/components/about/AboutPageContent";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover the story behind Bespokewala Fashion — our mission to celebrate Indian textile heritage, our vision for global luxury, and the master craftsmen who bring every garment to life.",
};

export default function AboutPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <AboutPageContent />
      </main>
          </>
  );
}
