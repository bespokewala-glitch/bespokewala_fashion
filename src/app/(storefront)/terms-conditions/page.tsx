import type { Metadata } from "next";
import TermsConditionsContent from "@/components/legal/TermsConditionsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Read Bespokewala Fashion's Terms & Conditions governing the use of our website and the purchase of our products.",
};

export default function TermsConditionsPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <TermsConditionsContent />
      </main>
          </>
  );
}
