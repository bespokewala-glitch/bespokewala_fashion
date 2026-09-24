import type { Metadata } from "next";
import TrackOrderContent from "@/components/track-order/TrackOrderContent";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your Bespokewala order in real-time. Enter your order number and email address to get the latest status and delivery updates.",
};

export default function TrackOrderPage() {
  return (
    <>
            <main style={{ minHeight: "80vh" }}>
        <TrackOrderContent />
      </main>
          </>
  );
}
