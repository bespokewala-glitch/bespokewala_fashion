import type { Metadata } from "next";
import SizeGuideContent from "@/components/size-guide/SizeGuideContent";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "Find your perfect fit with Bespokewala Fashion's comprehensive size guide. Detailed measurement charts for lehengas, sarees, kurtis, blouses, sherwanis, suits, and accessories.",
};

export default function SizeGuidePage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <SizeGuideContent />
      </main>
          </>
  );
}
