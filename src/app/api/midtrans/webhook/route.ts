import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      custom_field1: tagihan_id
    } = body;

    // 1. Validate signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const hashed = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (hashed !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const supabase = createClient();

    // 2. Check for idempotency (if already processed)
    const { data: existingPayment } = await supabase
      .from("pembayaran")
      .select("id")
      .eq("order_id", order_id)
      .eq("status", "VERIFIED")
      .single();

    if (existingPayment) {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // 3. Process Settlement
    if (
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")
    ) {
      const amountPaid = parseInt(gross_amount);

      // We use the same logic as process_manual_payment but as a direct Supabase call
      // or we can call the RPC if we want consistency.
      // However, RPC is better for atomicity.
      
      const { error: rpcError } = await supabase.rpc("process_manual_payment", {
        p_tagihan_id: tagihan_id,
        p_jumlah_bayar: amountPaid,
        p_metode: "MIDTRANS_QRIS",
        p_bank_pengirim: "Midtrans",
        p_bank_tujuan: "Midtrans",
        p_bukti_url: `Midtrans Transaction: ${order_id}`,
        p_order_id: order_id
      });

      if (rpcError) {
        console.error("RPC Error in Webhook:", rpcError);
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
