import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import https from "https";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = "INR" } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials missing");
      return NextResponse.json({ message: "Payment gateway not configured" }, { status: 500 });
    }

    const razorpayOrder = await createRazorpayOrder(
      { amount: Math.round(amount * 100), currency, receipt: `receipt_${Date.now()}` },
      keyId,
      keySecret
    );

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ message: error.message || "Failed to create payment order" }, { status: 500 });
  }
}

function createRazorpayOrder(
  data: { amount: number; currency: string; receipt: string },
  keyId: string,
  keySecret: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const body = JSON.stringify(data);
    const options: https.RequestOptions = {
      hostname: "api.razorpay.com",
      path: "/v1/orders",
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => { responseData += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.description || `Razorpay API error: ${res.statusCode}`));
          }
        } catch {
          reject(new Error("Failed to parse Razorpay response"));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
