"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats(filters?: { dateStart?: string; dateEnd?: string }) {
  const supabase = createClient();

  // 1. Total Pemasukan (Status LUNAS)
  let incomeQuery = supabase
    .from("pembayaran")
    .select("jumlah_bayar, created_at")
    .eq("status", "LUNAS");

  if (filters?.dateStart) {
    incomeQuery = incomeQuery.gte("created_at", filters.dateStart);
  }
  if (filters?.dateEnd) {
    incomeQuery = incomeQuery.lte("created_at", filters.dateEnd);
  }
  
  const { data: incomeData } = await incomeQuery;
  const totalIncome = incomeData?.reduce((acc, curr) => acc + Number(curr.jumlah_bayar), 0) || 0;

  // 2. Total Tunggakan (Status BELUM_LUNAS)
  const { data: arrearsData } = await supabase
    .from("tagihan")
    .select("jumlah")
    .eq("status", "BELUM_LUNAS");
  
  const totalArrears = arrearsData?.reduce((acc, curr) => acc + Number(curr.jumlah), 0) || 0;

  // 3. Mahasiswa Aktif
  const { count: studentCount } = await supabase
    .from("mahasiswa")
    .select("*", { count: "exact", head: true });

  // 4. Pending Verification
  const { count: pendingCount } = await supabase
    .from("pembayaran")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");

  // 5. Chart Data (Mocking last 6 months with real current data as latest point)
  const chartData = [
    { month: "Jan", total: 45000000 },
    { month: "Feb", total: 52000000 },
    { month: "Mar", total: 48000000 },
    { month: "Apr", total: 61000000 },
    { month: "Mei", total: 55000000 },
    { month: "Jun", total: totalIncome },
  ];

  return {
    totalIncome,
    totalArrears,
    studentCount: studentCount || 0,
    pendingCount: pendingCount || 0,
    chartData
  };
}

export async function getReports(filters: {
  dateStart?: string;
  dateEnd?: string;
  type?: string;
  method?: string;
  status?: string;
}) {
  const supabase = createClient();
  
  let query = supabase
    .from("pembayaran")
    .select(`
      *,
      tagihan:tagihan_id (
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

  // Filter nested requires manual filter or joining correctly
  // For simplicity here, we'll fetch and filter if type is needed, 
  // or use a more advanced Supabase syntax.
  
  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return { error: error.message };

  let filteredData = data;
  if (filters.type) {
    filteredData = data?.filter(p => p.tagihan.jenis === filters.type) || [];
  }

  return { data: filteredData };
}
