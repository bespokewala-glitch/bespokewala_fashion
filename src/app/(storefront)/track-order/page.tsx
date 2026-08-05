import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrackOrderContent from "@/components/track-order/TrackOrderContent";

export const metadata: Metadata = {
  title: "Track Your Order | Bespoken Fashion",
  description:
    "Track your Bespoken Fashion order in real-time. Enter your order number and email address to get the latest status and delivery updates.",
};

export default function TrackOrderPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh" }}>
        <TrackOrderContent />
      </main>
      <Footer />
    </>
  );
}
