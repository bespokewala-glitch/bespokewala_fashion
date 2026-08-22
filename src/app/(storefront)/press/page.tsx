import type { Metadata } from "next";
import PressPageContent from "@/components/press/PressPageContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Press & Media",
  description:
    "Bespokewala Fashion press coverage, media kit, brand assets, and enquiry contacts. Read what the media is saying about Bespokewala.",
};

export default function PressPage() {
  return (
    <>
      <main style={{ minHeight: "80vh" }}>
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading press content...</div>}>
          <PressPageContent />
        </Suspense>
      </main>
    </>
  );
}
