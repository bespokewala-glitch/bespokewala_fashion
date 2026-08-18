import type { Metadata } from "next";
import PrivacyPolicyContent from "@/components/legal/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read Bespokewala Fashion's Privacy Policy to understand how we collect, use, and protect your personal information when you shop with us.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <PrivacyPolicyContent />
      </main>
          </>
  );
}
