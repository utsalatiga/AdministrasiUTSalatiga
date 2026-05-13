"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Student {
  id: string;
  nim: string;
  nama: string;
  prodi: string;
  angkatan: string;
  created_at: string;
  total_tagihan?: number;
  deposit?: number;
  status_keuangan?: "LUNAS" | "MENUNGGAK" | "TIDAK ADA TAGIHAN";
}

export function useStudents(searchQuery: string = "", page: number = 1, pageSize: number = 10) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("mahasiswa")
        .select("*, tagihan(jumlah, status)", { count: "exact" });

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
        const total = bills.reduce((acc: number, curr: any) => acc + Number(curr.jumlah), 0);
        const hasUnpaid = bills.some((b: any) => b.status === "BELUM_LUNAS");
        const isLunas = bills.length > 0 && bills.every((b: any) => b.status === "LUNAS");
        
        return {
          ...student,
          total_tagihan: total,
          status_keuangan: isLunas ? "LUNAS" : (hasUnpaid ? "MENUNGGAK" : "TIDAK ADA TAGIHAN")
        };
      });

      setStudents(processedData);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, page, pageSize, supabase]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    isLoading,
    error,
    totalCount,
    refresh: fetchStudents,
  };
}
