import type { Metadata } from "next";
import PressPageContent from "@/components/press/PressPageContent";

export const metadata: Metadata = {
  title: "Press & Media",
  description:
    "Bespokewala Fashion press coverage, media kit, brand assets, and enquiry contacts. Read what the media is saying about Bespokewala.",
};

export default function PressPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <PressPageContent />
      </main>
          </>
  );
}
