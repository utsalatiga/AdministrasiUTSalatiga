import { z } from "zod";

// Helper function to parse dates gracefully
const parseGracefulDate = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;
  
  // If it's already a Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split("T")[0];
  }

  if (typeof val !== "string") return null;
  const clean = val.trim();
  if (!clean) return null;

  // 1. Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : clean;
  }

  // 2. Format: DD/MM/YYYY or DD-MM-YYYY or D/M/YYYY or D-M-YYYY
  const dmyRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = clean.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed month
    const year = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) {
      const paddedDay = String(day).padStart(2, '0');
      const paddedMonth = String(month + 1).padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
  }

  // 3. Fallback standard JavaScript parsing
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
};

// Helper function to parse numbers gracefully
const parseGracefulNumber = (val: unknown): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const clean = val.trim();
    if (!clean) return 0;
    const parsed = Number(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Graceful date preprocessor schema
export const gracefulDateSchema = z.preprocess((val) => {
  try {
    return parseGracefulDate(val);
  } catch {
    return null;
  }
}, z.string().nullable().optional());

// Graceful number preprocessor schema
export const gracefulNumberSchema = z.preprocess((val) => {
  try {
    return parseGracefulNumber(val);
  } catch {
    return 0;
  }
}, z.number().nullable().optional());

// billing item schema for import
export const billingImportSchema = z.object({
  jenis: z.string().nullable().optional(),
  nominal: gracefulNumberSchema,
  status: z.enum(["LUNAS", "BELUM_LUNAS", "DICICIL"]).nullable().optional(),
  nomor_billing: z.string().nullable().optional(),
  jatuh_tempo: gracefulDateSchema,
});

// student row schema for import
export const studentImportRowSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  prodi: z.string().nullable().optional(),
  angkatan: z.string().nullable().optional(),
  nik: z.string().nullable().optional(),
  tanggal_lahir: gracefulDateSchema,
  nama_ibu: z.string().nullable().optional(),
  no_hp: z.string().nullable().optional(),
  lokasi_ujian: z.string().nullable().optional(),
  billings: z.array(billingImportSchema).nullable().optional(),
});

// list of rows schema
export const studentImportBatchSchema = z.array(studentImportRowSchema);
