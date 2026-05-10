"use client";

import { useState } from "react";
import { Search, UserPlus, FileUp, RefreshCw } from "lucide-react";
import { useStudents, Student } from "@/hooks/useStudents";
import StudentTable from "@/components/students/StudentTable";
import StudentFormModal from "@/components/students/StudentFormModal";
import ImportExcelModal from "@/components/students/ImportExcelModal";
import StudentDetailModal from "@/components/students/StudentDetailModal";

export default function MahasiswaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { 
    students, 
    isLoading, 
    totalCount, 
    refresh 
  } = useStudents(searchQuery, page, 10);

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-slate-900">Data Mahasiswa</h1>
          <p className="text-slate-500 text-sm">Kelola informasi data induk mahasiswa UT Salatiga.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileUp className="h-4 w-4" />
            <span>Import Excel</span>
          </button>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-sidebar text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Mahasiswa</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari NIM atau Nama..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
          />
        </div>
        <button 
          onClick={() => refresh()}
          className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
          title="Refresh Data"
        >
          <RefreshCw className={isLoading ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
        </button>
      </div>

      <StudentTable 
        students={students}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        onEdit={handleEdit}
        onView={handleView}
        onRefresh={refresh}
      />

      <StudentFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={refresh}
        student={selectedStudent}
      />

      <ImportExcelModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={refresh}
      />

      <StudentDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        studentId={selectedStudent?.id || null}
      />
    </div>
  );
}

