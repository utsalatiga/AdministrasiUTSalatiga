"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats(filters?: { dateStart?: string; dateEnd?: string }) {
  const supabase = createClient();

  // 1. Total Pemasukan (Status VERIFIED atau LUNAS)
  let incomeQuery = supabase
    .from("pembayaran")
    .select("jumlah_bayar, created_at")
    .in("status", ["VERIFIED", "LUNAS"]);

  if (filters?.dateStart) {
    incomeQuery = incomeQuery.gte("created_at", filters.dateStart);
  }
  if (filters?.dateEnd) {
    incomeQuery = incomeQuery.lte("created_at", filters.dateEnd);
  }
  
  const { data: incomeData } = await incomeQuery;
  const totalIncome = incomeData?.reduce((acc, curr) => acc + Number(curr.jumlah_bayar), 0) || 0;

  // 2. Total Tunggakan (Sisa Tagihan dari tagihan BELUM_LUNAS atau MENCICIL)
  const { data: arrearsData } = await supabase
    .from("tagihan")
    .select("sisa_tagihan")
    .in("status", ["BELUM_LUNAS", "MENCICIL"]);
  
  const totalArrears = arrearsData?.reduce((acc, curr) => acc + Number(curr.sisa_tagihan || 0), 0) || 0;

  // 3. Mahasiswa Aktif
  const { count: studentCount } = await supabase
    .from("mahasiswa")
    .select("*", { count: "exact", head: true });

  // 4. Pending Verification
  const { count: pendingCount } = await supabase
    .from("pembayaran")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");

  // 5. Transaksi Hari Ini
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("pembayaran")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // 6. Real Dynamic Chart Data (Last 6 Months)
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const now = new Date();
  const chartData = [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const { data: allIncome } = await supabase
    .from("pembayaran")
    .select("jumlah_bayar, created_at")
    .in("status", ["VERIFIED", "LUNAS"])
    .gte("created_at", sixMonthsAgo.toISOString());

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    
    const monthlyTotal = allIncome
      ?.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === year;
      })
      .reduce((acc, curr) => acc + Number(curr.jumlah_bayar), 0) || 0;

    chartData.push({ month: monthName, total: monthlyTotal });
  }

  return {
    totalIncome,
    totalArrears,
    studentCount: studentCount || 0,
    pendingCount: pendingCount || 0,
    todayCount: todayCount || 0,
    chartData
  };
}

export async function getReports(filters: {
  dateStart?: string;
  dateEnd?: string;
  type?: string;
  method?: string;
  status?: string;
  hasProof?: boolean;
}) {

  const supabase = createClient();
  
  let query = supabase
    .from("pembayaran")
    .select(`
      *,
      tagihan:tagihan_id (
        id,
        jenis,
        mahasiswa:mahasiswa_id (
          nama,
          nim
        )
      )
    `);

  if (filters.dateStart) {
    query = query.gte("created_at", filters.dateStart);
  }
  if (filters.dateEnd) {
    query = query.lte("created_at", filters.dateEnd);
  }

  if (filters.method) {
    query = query.eq("metode", filters.method);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  
  if (filters.hasProof) {
    query = query.not("bukti_url", "is", null);
  }


  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return { error: error.message };

  let filteredData = data;
  if (filters.type) {
    filteredData = data?.filter(p => p.tagihan.jenis === filters.type) || [];
  }

  return { data: filteredData };
}
