import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { tagihan_id, jumlah_bayar } = await request.json();

    if (!tagihan_id || !jumlah_bayar) {
      return NextResponse.json(
        { error: "Tagihan ID and Jumlah Bayar are required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Fetch tagihan details
    const { data: tagihan, error: tagihanError } = await supabase
      .from("tagihan")
      .select(`
        *,
        mahasiswa:mahasiswa_id (
          nama,
          nim,
          email
        )
      `)
      .eq("id", tagihan_id)
      .single();

    if (tagihanError || !tagihan) {
      return NextResponse.json(
        { error: "Tagihan not found" },
        { status: 404 }
      );
    }

    // Initialize Midtrans Snap client
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    });

    const order_id = `BILL-${tagihan.kode}-${Date.now()}`;

    let parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: jumlah_bayar,
      },
      customer_details: {
        first_name: tagihan.mahasiswa.nama,
        email: tagihan.mahasiswa.email || `${tagihan.mahasiswa.nim}@student.ut.ac.id`,
      },
      item_details: [
        {
          id: tagihan.kode,
          price: jumlah_bayar,
          quantity: 1,
          name: `Pembayaran ${tagihan.jenis}`,
        },
      ],
      custom_field1: tagihan_id, // Important for webhook
      custom_field2: tagihan.mahasiswa_id,
    };

    const transaction = await snap.createTransaction(parameter);
    
    return NextResponse.json({
      token: transaction.token,
      order_id: order_id
    });

  } catch (error: any) {
    console.error("Midtrans Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
