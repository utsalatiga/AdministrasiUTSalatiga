"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Student {
  id: string;
  nim: string;
  nama: string;
  prodi: string;
  angkatan: string;
  nik?: string;
  tanggal_lahir?: string;
  nama_ibu?: string;
  no_wa?: string;
  lokasi_ujian?: string;
  created_at: string;
  total_tagihan?: number;
  deposit?: number;
  status_keuangan?: "LUNAS" | "MENUNGGAK" | "DICICIL" | "BELUM_LUNAS" | "TIDAK ADA TAGIHAN";
}

export function useStudents(searchQuery: string = "", page: number = 1, pageSize: number = 10) {
  const supabase = createClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["students", searchQuery, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("mahasiswa")
        .select("id, nim, nama, prodi, angkatan, deposit, nik, tanggal_lahir, nama_ibu, no_wa, lokasi_ujian, created_at, tagihan(jumlah, sisa_tagihan, status)", { count: "exact" });

      if (searchQuery) {
        query = query.or(`nama.ilike.%${searchQuery}%,nim.ilike.%${searchQuery}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error: fetchError } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      // Map financial data
      const processedData = (data as any[]).map(student => {
        const bills = student.tagihan || [];
        const totalSisa = bills.reduce((acc: number, curr: any) => {
          const sisa = curr.sisa_tagihan !== null ? curr.sisa_tagihan : (curr.status === "LUNAS" ? 0 : curr.jumlah);
          return acc + Number(sisa);
        }, 0);
        
        let status_keuangan: "LUNAS" | "MENUNGGAK" | "DICICIL" | "BELUM_LUNAS" | "TIDAK ADA TAGIHAN" = "TIDAK ADA TAGIHAN";
        if (bills.length > 0) {
          if (totalSisa === 0) {
            status_keuangan = "LUNAS";
          } else {
            const unpaidBills = bills.filter((b: any) => {
              const sisa = b.sisa_tagihan !== null ? b.sisa_tagihan : (b.status === "LUNAS" ? 0 : b.jumlah);
              return sisa > 0;
            });
            
            const hasBelumLunas = unpaidBills.some((b: any) => b.status === "BELUM_LUNAS");
            if (hasBelumLunas || unpaidBills.length === 0) {
              status_keuangan = "MENUNGGAK";
            } else {
              status_keuangan = "DICICIL";
            }
          }
        }
        
        return {
          ...student,
          total_tagihan: totalSisa,
          status_keuangan
        };
      });

      return {
        students: processedData,
        totalCount: count || 0
      };
    },
    staleTime: 30000, // 30 seconds
  });

  return {
    students: data?.students || [],
    isLoading,
    error: error ? (error as any).message : null,
    totalCount: data?.totalCount || 0,
    refresh: refetch,
  };
}
