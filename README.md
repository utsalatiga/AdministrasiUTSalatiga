# Sistem Keuangan UT Salatiga

Sistem Administrasi & Keuangan Mahasiswa UT Salatiga built with Next.js 14 and Supabase.

## Setup Database

Pastikan tabel berikut tersedia di Supabase:

### 1. Profiles Table
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('admin', 'staff', 'student')) default 'student',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);
```

### 2. Mahasiswa Table
```sql
create table public.mahasiswa (
  id uuid default gen_random_uuid() primary key,
  nim text unique not null,
  nama text not null,
  prodi text,
  angkatan text,
  created_at timestamp with time zone default now()
);
```

### 3. Tagihan Table
```sql
create table public.tagihan (
  id uuid default gen_random_uuid() primary key,
  mahasiswa_id uuid references public.mahasiswa(id) on delete cascade,
  kode text unique not null,
  jenis text,
  jumlah decimal not null,
  status text check (status in ('LUNAS', 'PENDING', 'BELUM LUNAS')) default 'BELUM LUNAS',
  jatuh_tempo date,
  created_at timestamp with time zone default now()
);
```

### 4. Pembayaran Table
```sql
create table public.pembayaran (
  id uuid default gen_random_uuid() primary key,
  tagihan_id uuid references public.tagihan(id) on delete cascade,
  metode text,
  status text check (status in ('LUNAS', 'PENDING', 'GAGAL')) default 'PENDING',
  jumlah_payar decimal not null,
  bukti_url text,
  created_at timestamp with time zone default now()
);
```

## Running Locally

1. Update `.env.local` dengan kredensial Supabase Anda.
2. `npm install`
3. `npm run dev`
