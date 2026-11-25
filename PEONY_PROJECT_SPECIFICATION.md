# PEONY --- Project Specification untuk AI Agent

> Dokumen ini adalah acuan utama (project brief / implementation
> specification) untuk membangun website dan sistem manajemen reseller
> Peony.
>
> **Tujuan AI agent:** implementasikan aplikasi sesuai spesifikasi ini
> secara bertahap, aman, konsisten, dan siap di-deploy ke Vercel. Jangan
> menganggap data contoh sebagai data produksi. Jika ada keputusan yang
> belum ditentukan, gunakan ketentuan pada bagian **Asumsi dan keputusan
> yang perlu dikonfirmasi** dan jangan mengarang integrasi eksternal.

------------------------------------------------------------------------

## 1. Ringkasan Proyek

Bangun platform **Peony Reseller Management System** yang terdiri dari:

1.  **Public website**: landing page Peony dengan menu yang dikelola
    secara dinamis.
2.  **Autentikasi dan dashboard reseller**: reseller mendaftar, login,
    melihat pricelist, membuat laporan garansi, dan memantau status
    laporan.
3.  **Admin dashboard**: admin mengelola reseller, produk/harga,
    kategori, laporan garansi, menu homepage, banner, tautan Telegram,
    pengaturan website, serta aktivitas admin.

Website harus mengutamakan pengalaman mobile karena desain referensi
berupa landing page mobile.

### Tujuan bisnis

-   Memudahkan calon reseller mendaftar secara mandiri.
-   Memberikan akses pricelist yang sama kepada semua reseller.
-   Memusatkan data reseller dan laporan garansi.
-   Memungkinkan admin mengelola konten tanpa mengubah source code.
-   Menyediakan pemantauan status garansi bagi reseller.

------------------------------------------------------------------------

## 2. Teknologi dan Arsitektur

Gunakan stack berikut:

  -----------------------------------------------------------------------
  Area                                Teknologi
  ----------------------------------- -----------------------------------
  Framework                           Next.js dengan App Router

  Bahasa                              TypeScript

  UI                                  Tailwind CSS

  Database                            Supabase PostgreSQL

  Authentication                      Supabase Auth

  File storage                        Supabase Storage

  Hosting                             Vercel

  Export spreadsheet                  XLSX atau library sejenis yang
                                      kompatibel dengan Node.js

  Ikon                                Lucide

  Validasi form                       Zod dan React Hook Form
                                      (direkomendasikan)
  -----------------------------------------------------------------------

### Prinsip arsitektur

-   Gunakan Next.js App Router dan pola Server Components secara
    default.
-   Gunakan Client Components hanya untuk UI yang membutuhkan interaksi
    browser.
-   Pisahkan komponen UI, business logic, akses database, validasi, dan
    tipe data.
-   Buat Supabase client terpisah untuk browser dan server sesuai
    panduan SSR Supabase yang berlaku.
-   Operasi sensitif harus dijalankan di server.
-   Jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke browser.
-   Gunakan environment variables untuk seluruh konfigurasi rahasia.
-   Jangan menaruh kredensial atau token asli di source code.
-   Terapkan Row Level Security (RLS) pada seluruh tabel yang dapat
    diakses melalui Supabase client.
-   Jangan mengandalkan middleware atau penyembunyian tombol sebagai
    satu-satunya lapisan keamanan; validasi izin juga harus dilakukan di
    server dan RLS.
-   Gunakan UUID sebagai primary key untuk entitas utama.
-   Tambahkan `created_at` dan `updated_at` pada tabel yang relevan.
-   Simpan waktu dalam format timestamp yang konsisten; tampilkan sesuai
    zona waktu Indonesia (`Asia/Jakarta`) kecuali ada keputusan bisnis
    lain.

------------------------------------------------------------------------

## 3. Identitas Visual dan UI/UX

### Referensi desain

Gunakan gambar referensi Peony yang diberikan pengguna dalam percakapan
sebagai acuan visual utama untuk public homepage.

Ciri visual: - Latar dominan hitam. - Aksen gradasi pink, magenta, dan
oranye/emas. - Bunga peony sebagai elemen dekoratif. - Logo dan tulisan
**PEONY** di bagian atas. - Tagline **TOGETHER · GROW · MORE**. - Kartu
menu dengan border bercahaya pink-oranye, sudut membulat, ikon di kiri,
teks di tengah, dan chevron di kanan. - Footer bertuliskan **PEONY CARE
FOR YOU**. - Nuansa elegan, feminin, premium, dan modern.

### Aturan desain

-   Pertahankan karakter visual Peony pada public website.
-   Dashboard reseller dan admin boleh lebih fungsional, tetapi tetap
    menggunakan identitas warna Peony.
-   Desain harus responsive, mobile-first, dan nyaman digunakan di
    desktop.
-   Gunakan kontras warna yang cukup dan ukuran teks yang mudah dibaca.
-   Sediakan loading, empty, success, error, dan disabled states.
-   Gunakan konfirmasi sebelum tindakan destruktif seperti menghapus
    data atau menonaktifkan akun.
-   Jangan menggunakan angka, harga, produk, atau data contoh
    seolah-olah data produksi.
-   Sediakan placeholder yang jelas jika data belum tersedia.

------------------------------------------------------------------------

## 4. Jenis Pengguna dan Hak Akses

Terdapat dua role utama:

### 4.1 Reseller

Reseller dapat: - Mendaftar akun. - Login dan logout. - Melihat serta
memperbarui data profil yang diizinkan. - Melihat pricelist yang
aktif. - Melihat kategori dan detail produk. - Membuat laporan
garansi. - Melihat laporan garansi miliknya sendiri. - Melihat status
dan tanggapan laporan garansi miliknya. - Mengubah password melalui alur
aman Supabase Auth.

Reseller tidak dapat: - Mengakses halaman admin. - Mengubah harga atau
produk. - Melihat data reseller lain. - Melihat laporan garansi milik
reseller lain. - Mengubah status garansi. - Mengubah role atau status
akun sendiri.

### 4.2 Admin

Admin dapat: - Mengakses seluruh fitur admin. - Melihat dan mengelola
data reseller. - Mengaktifkan atau menonaktifkan akun reseller. -
Melihat bukti pendaftaran. - Mengelola produk, kategori, dan harga. -
Mengelola laporan garansi dan tanggapan. - Mengelola menu homepage,
banner, link Telegram, dan pengaturan website. - Mengekspor data. -
Melihat activity log.

Jika kelak dibutuhkan, sistem dapat dikembangkan menjadi beberapa level
admin/staff dengan permission berbeda. Untuk versi awal, minimal
sediakan role `admin` dan `reseller`.

**Penting:** role tidak boleh dapat diubah sendiri oleh pengguna melalui
form atau request browser. Penetapan role harus dilakukan melalui proses
server yang terlindungi.

------------------------------------------------------------------------

## 5. Public Website

### 5.1 Homepage (`/`)

Homepage menampilkan: - Logo Peony. - Tagline. - Daftar menu aktif yang
diambil dari database. - Banner aktif yang diambil dari database (jika
tersedia). - Footer Peony Care For You.

Menu homepage harus dinamis. Admin dapat menambah, mengedit,
mengurutkan, mengaktifkan, dan menonaktifkan menu tanpa mengubah kode.

Jenis tindakan menu: - `internal`: menuju halaman internal. -
`external`: membuka URL eksternal. - `telegram`: membuka channel
Telegram. - `custom`: membuka URL yang ditentukan admin.

Validasi URL harus dilakukan di server. Jangan mengizinkan skema URL
berbahaya seperti `javascript:`.

Menu awal yang disediakan: 1. Daftar / Join Ress. 2. Pricelist Reseller.
3. Chanel Peony. 4. Lapor Garansi.

Nama dan deskripsi menu dapat diedit admin. Ejaan awal "Chanel Peony"
mengikuti materi brand yang diberikan; admin boleh memperbaruinya
menjadi "Channel Peony".

### 5.2 Halaman pendaftaran (`/register`)

Form pendaftaran terdiri dari dua kelompok.

#### A. Data reseller

  -------------------------------------------------------------------------
  Label             Field teknis yang   Tipe              Ketentuan
                    disarankan                            
  ----------------- ------------------- ----------------- -----------------
  Nama BA           `ba_name`           Text              Wajib

  Awal BA (tahun)   `ba_start_year`     Number            Wajib; validasi
                                                          tahun masuk akal

  Username X/IG     `sales_username`    Text              Wajib; dapat
  jualan                                                  berisi username
                                                          atau URL

  SS/link testi     `testimonials`      Multi upload /    Minimal 3 bukti
                                        URL               testimoni dalam 3
                                                          bulan terakhir

  SS pricelist      `pricelist_proof`   Upload gambar     Wajib;
                                                          keterangan:
                                                          pricelist tidak
                                                          underprice
  -------------------------------------------------------------------------

Ketentuan upload: - Terima format gambar umum seperti JPG, PNG, dan
WebP. - Batasi ukuran file dan jumlah file melalui konfigurasi. -
Validasi tipe file di server, bukan hanya berdasarkan ekstensi. - Simpan
file pada Supabase Storage. - Bukti testimoni dan pricelist bersifat
privat dan hanya dapat dilihat pemilik yang berwenang serta admin. -
Untuk testimoni, dukung kombinasi upload screenshot dan URL. Minimal
harus ada tiga bukti yang valid. - Berikan instruksi bahwa bukti
testimoni harus berasal dari tiga bulan terakhir. - Berikan instruksi
bahwa screenshot pricelist yang diunggah tidak boleh menunjukkan harga
di bawah ketentuan Peony.

#### B. Data akun login

  Label                 Field teknis   Tipe        Ketentuan
  --------------------- -------------- ----------- -------------------------------
  Nama lengkap          `full_name`    Text        Wajib
  Email                 `email`        Email       Wajib dan unik
  Nomor WhatsApp        `phone`        Telephone   Wajib
  Password              ---            Password    Wajib, diproses Supabase Auth
  Konfirmasi password   ---            Password    Harus sama dengan password

Ketentuan: - Password tidak boleh disimpan dalam tabel aplikasi, log,
atau metadata yang dapat dibaca admin. - Gunakan Supabase Auth untuk
membuat akun. - Semua reseller memakai satu jenis harga yang sama. -
Pendaftaran otomatis aktif; tidak menunggu persetujuan admin. - Setelah
pendaftaran berhasil, reseller dapat login dan mengakses pricelist. -
Jika Supabase Auth dikonfigurasi tanpa verifikasi email, jelaskan risiko
dan tambahkan perlindungan seperti rate limiting dan validasi email.
Jangan menganggap email telah terverifikasi jika memang tidak. - Jika
verifikasi email diaktifkan, jangan membuat alur yang menyatakan akun
sudah siap login sebelum status Auth mengizinkan login. Keputusan awal
pengguna adalah pendaftaran otomatis, sehingga konfigurasi yang dipilih
harus mendukung akses langsung. - Buat profil dan data reseller setelah
akun Auth berhasil dibuat. - Tangani kegagalan parsial dengan benar.
Jika pembuatan profil atau upload gagal setelah akun Auth dibuat,
sediakan mekanisme pemulihan atau kompensasi agar tidak meninggalkan
akun tanpa profil. - Tampilkan pesan sukses dan arahkan pengguna ke
dashboard reseller atau halaman login sesuai status sesi.

### 5.3 Halaman login (`/login`)

-   Login menggunakan email dan password melalui Supabase Auth.
-   Sediakan validasi form dan pesan error yang tidak membocorkan
    informasi sensitif.
-   Sediakan fitur lupa password/reset password.
-   Setelah login, arahkan reseller ke `/dashboard`.
-   Admin yang login diarahkan ke `/admin`.
-   Pengguna yang sudah login tidak perlu mengakses halaman login
    kembali kecuali logout.

### 5.4 Pricelist (`/pricelist` atau `/dashboard/pricelist`)

Semua reseller menggunakan harga yang sama.

Data produk: - Nama produk. - Slug. - Deskripsi. - Foto produk. -
Kategori. - Harga reseller. - Status aktif/nonaktif. - Urutan
tampilan. - Waktu pembaruan.

Fitur: - Grid/list produk responsive. - Pencarian produk. - Filter
kategori. - Detail produk. - Harga ditampilkan konsisten untuk semua
reseller. - Produk nonaktif tidak tampil pada katalog publik/reseller. -
Katalog dapat diakses melalui homepage jika admin mengaktifkan menu
terkait. - Rute dashboard tetap memerlukan autentikasi jika katalog
ditetapkan sebagai fitur khusus reseller.

**Keputusan implementasi:** sediakan satu sumber data katalog dan satu
nilai harga per produk. Jangan membuat level harga Basic/Premium/VIP
atau tabel harga bertingkat untuk versi awal.

### 5.5 Channel Peony

-   Menu membuka URL Telegram yang dikonfigurasi admin.
-   Admin dapat mengubah nama channel, deskripsi, URL, dan status menu.
-   Tidak perlu Telegram API untuk fungsi redirect.
-   Jika URL belum dikonfigurasi, jangan tampilkan tautan rusak.

### 5.6 Form laporan garansi (`/dashboard/garansi`)

Form ini digunakan oleh reseller yang sudah login.

Field yang diminta pengguna: - Nama reseller. - Tanggal order. - Tanggal
report. - Aplikasi. - Sisa durasi. - Email. - Password. - Profile dan
PIN. - Kendala (jelaskan).

#### Penanganan field sensitif

**Jangan meminta atau menyimpan password akun aplikasi maupun PIN
rahasia dalam database, log, export Excel, notifikasi, atau
attachment.** Password dan PIN bukan data yang aman untuk dikumpulkan
melalui form garansi.

Implementasikan alternatif berikut: - Nama reseller diisi otomatis dari
profil login dan tidak dapat diubah pada form. - Tanggal order diisi
reseller. - Tanggal report dibuat otomatis oleh server ketika laporan
disimpan. - Aplikasi dipilih dari daftar aplikasi yang dikelola admin;
sediakan pilihan "Lainnya" jika diperlukan. - Sisa durasi dihitung
otomatis jika data yang diperlukan tersedia; jika belum, reseller dapat
memasukkan estimasi dengan penanda "estimasi". - Email akun terkait
diisi reseller. - Profile diartikan sebagai username atau URL profil
akun terkait, bukan password. - PIN: jangan dikumpulkan pada versi awal.
Jika ada kebutuhan operasional yang benar-benar mengharuskan PIN,
evaluasi mekanisme sementara yang aman secara terpisah dan jangan
menyimpan PIN permanen. - Kendala dijelaskan dalam textarea. - Tambahkan
upload bukti pendukung jika diperlukan, dengan akses privat.

Jika pemilik produk tetap menghendaki password/PIN, hentikan
implementasi bagian tersebut dan minta keputusan keamanan yang
eksplisit. Jangan diam-diam menambahkan penyimpanan kredensial.

### 5.7 Perhitungan sisa durasi dan WebRefund

URL referensi yang diberikan: `https://webrefund.peony.web.id`

Tujuan: - Membantu reseller/admin menghitung sisa durasi berdasarkan
tanggal order, tanggal report, aplikasi, dan durasi awal yang relevan. -
Sisa durasi disimpan sebagai hasil perhitungan atau estimasi dengan
penanda sumbernya.

Ketentuan: - Jangan menganggap WebRefund memiliki API publik. - Jangan
melakukan scraping atau mengandalkan struktur HTML situs pihak ketiga
tanpa izin dan tanpa memastikan kestabilannya. - Periksa dokumentasi/API
resmi terlebih dahulu jika integrasi langsung diperlukan. - Jika tidak
ada API resmi yang tersedia, implementasikan kalkulator internal hanya
setelah aturan perhitungan dikonfirmasi pemilik bisnis. - Sediakan
tombol "Buka WebRefund" untuk membuka URL tersebut. - Jangan mengarang
formula refund atau sisa durasi.

**Informasi yang masih perlu dikonfirmasi:** bagaimana durasi awal
diperoleh, satuan durasi (hari/bulan), aturan pembulatan, dan apakah
perhitungan sisa durasi hanya berdasarkan tanggal atau juga berdasarkan
kebijakan khusus tiap aplikasi.

### 5.8 Cek status garansi

Reseller hanya dapat melihat laporan miliknya sendiri.

Informasi yang ditampilkan: - Kode laporan. - Tanggal order. - Tanggal
report. - Aplikasi. - Sisa durasi. - Kendala. - Status. - Tanggapan
admin. - Waktu pembaruan terakhir.

Status laporan: - `submitted`: laporan diterima. - `reviewing`: sedang
diperiksa. - `approved`: garansi disetujui. - `rejected`: garansi
ditolak. - `completed`: penanganan selesai.

Reseller tidak boleh mengubah status laporan. Admin dapat mengubah
status dan memberikan tanggapan.

------------------------------------------------------------------------

## 6. Dashboard Reseller

Route utama: `/dashboard`

Menu: 1. Dashboard. 2. Pricelist. 3. Lapor Garansi. 4. Riwayat Garansi.
5. Profil Saya. 6. Channel Peony. 7. Pengaturan Akun / Ubah Password. 8.
Logout.

Dashboard menampilkan: - Sapaan dan nama reseller. - Status akun. -
Ringkasan jumlah laporan garansi. - Jumlah laporan yang sedang
diproses. - Jumlah laporan selesai. - Laporan terbaru. - Akses cepat ke
pricelist dan form garansi.

Reseller hanya boleh membaca atau mengubah profil miliknya sendiri
sesuai field yang diizinkan. Perubahan email/password harus menggunakan
alur Supabase Auth yang aman.

------------------------------------------------------------------------

## 7. Admin Dashboard

Route utama: `/admin`

### 7.1 Dashboard

Tampilkan ringkasan data real dari database: - Total reseller. -
Reseller aktif. - Total produk aktif. - Total laporan garansi. - Laporan
menunggu pemeriksaan. - Grafik pendaftaran reseller per periode. -
Grafik laporan garansi per status. - Daftar pendaftaran terbaru. -
Daftar laporan garansi terbaru.

Jangan menggunakan angka statis atau data dummy setelah integrasi
selesai.

### 7.2 Manajemen reseller (`/admin/resellers`)

Fitur: - Daftar reseller dengan pagination. - Pencarian nama, email,
nomor WhatsApp, dan nama BA. - Filter status akun dan tanggal
pendaftaran. - Detail profil reseller. - Lihat bukti testimoni. - Lihat
screenshot pricelist. - Edit field profil yang diizinkan. -
Aktifkan/nonaktifkan akun. - Catatan internal admin. - Export Excel.

Ketika akun dinonaktifkan: - Blokir akses reseller ke fitur
terlindungi. - Jangan menghapus data reseller. - Catat tindakan admin di
activity log. - Sediakan mekanisme pengaktifan kembali.

### 7.3 Manajemen produk dan pricelist

Route: - `/admin/products` - `/admin/categories`

Fitur produk: - Tambah, edit, arsip/nonaktifkan produk. - Upload/ganti
foto produk. - Atur nama, slug, deskripsi, kategori, harga reseller,
status, dan urutan. - Validasi harga berupa angka nonnegatif. -
Konfirmasi sebelum menghapus permanen. - Utamakan soft
delete/nonaktifkan agar histori tidak rusak.

Fitur kategori: - Tambah, edit, urutkan, aktif/nonaktifkan kategori.

Semua reseller melihat harga yang sama. Perubahan harga admin berlaku
pada katalog setelah berhasil disimpan.

### 7.4 Manajemen laporan garansi (`/admin/warranties`)

Fitur: - Daftar seluruh laporan. - Pencarian kode laporan, nama
reseller, email, atau aplikasi. - Filter status dan rentang tanggal. -
Detail laporan. - Melihat attachment privat melalui signed URL. -
Mengubah status. - Memberikan tanggapan yang terlihat reseller. -
Catatan internal yang hanya terlihat admin. - Export Excel tanpa data
rahasia. - Riwayat perubahan status.

Setiap perubahan status harus mencatat: - Admin yang melakukan
perubahan. - Status sebelum dan sesudah. - Waktu perubahan. - Catatan
jika ada.

### 7.5 Manajemen menu homepage (`/admin/menus`)

Field menu: - Judul. - Deskripsi. - Ikon. - Jenis tindakan. - Target
URL/route. - Status aktif. - Urutan. - Waktu pembuatan/perubahan.

Fitur: - Tambah menu. - Edit menu. - Hapus/nonaktifkan menu. -
Drag-and-drop untuk mengubah urutan. - Preview menu. - Validasi URL. -
Perubahan harus langsung tercermin pada homepage setelah tersimpan.

Menu awal: - Daftar / Join Ress. - Pricelist Reseller. - Chanel Peony. -
Lapor Garansi.

### 7.6 Manajemen banner (`/admin/banners`)

Field: - Judul. - Deskripsi/subjudul. - Gambar. - Teks tombol. - URL
tujuan. - Urutan. - Status aktif. - Opsional: tanggal mulai dan
berakhir.

Fitur: - Upload gambar ke Supabase Storage. - Preview desktop/mobile. -
Tambah, edit, hapus/nonaktifkan. - Atur urutan. - Validasi URL tujuan.

Jika tidak ada banner aktif, homepage tetap harus tampil baik.

### 7.7 Pengaturan Telegram (`/admin/telegram`)

-   Nama channel.
-   Deskripsi.
-   URL Telegram.
-   Status aktif.
-   Waktu pembaruan.

Tidak perlu mengirim notifikasi Telegram pada versi awal.

### 7.8 Pengaturan website (`/admin/settings`)

Minimal: - Nama website. - Logo. - Tagline. - Favicon. - Informasi
footer. - Kontak/WhatsApp (opsional). - SEO title dan description. -
Pengaturan tampilan yang memang diperlukan.

### 7.9 Admin dan activity log

-   Kelola akun admin secara aman.
-   Role admin tidak boleh dibuat melalui pendaftaran publik.
-   Activity log mencatat tindakan penting seperti perubahan harga,
    status reseller, status garansi, menu, banner, dan pengaturan.
-   Jangan mencatat password, token, PIN, atau data rahasia.

------------------------------------------------------------------------

## 8. Export Excel

Sediakan export Excel untuk: 1. Data reseller. 2. Data laporan garansi.

Ketentuan: - Hormati filter yang sedang diterapkan admin. - Gunakan nama
file yang jelas, misalnya `data-reseller-YYYY-MM-DD.xlsx`. - Header
kolom harus mudah dipahami. - Format tanggal konsisten. - Harga/angka
diekspor sebagai nilai numerik bila memungkinkan. - Jangan sertakan
password, PIN, token, atau kredensial. - Hanya admin berwenang yang
dapat mengunduh file. - Lakukan export di server jika data besar atau
sensitif.

------------------------------------------------------------------------

## 9. Rancangan Database Supabase

Gunakan PostgreSQL dengan UUID sebagai primary key. Nama tabel dan kolom
dapat mengikuti rancangan berikut. Agent boleh menambahkan kolom teknis
yang diperlukan, tetapi jangan mengubah makna field bisnis tanpa alasan
dan dokumentasi.

### 9.1 `profiles`

Profil aplikasi yang terhubung ke `auth.users`.

Kolom yang disarankan: -
`id uuid primary key references auth.users(id)`. -
`full_name text not null`. - `email text`. - `phone text`. -
`role text not null` --- nilai awal `reseller` atau `admin`. -
`is_active boolean not null default true`. - `created_at timestamptz`. -
`updated_at timestamptz`.

Email autentikasi tetap dikelola Supabase Auth. Hindari duplikasi yang
tidak konsisten.

### 9.2 `reseller_details`

-   `id uuid primary key`.
-   `user_id uuid unique references profiles(id)`.
-   `ba_name text not null`.
-   `ba_start_year integer not null`.
-   `sales_username text not null`.
-   `created_at timestamptz`.
-   `updated_at timestamptz`.

### 9.3 `reseller_testimonials`

-   `id uuid primary key`.
-   `reseller_id uuid references reseller_details(id)`.
-   `file_path text nullable`.
-   `external_url text nullable`.
-   `description text nullable`.
-   `evidence_date date nullable`.
-   `created_at timestamptz`.

Validasi minimal tiga bukti saat pendaftaran. Jangan menganggap setiap
URL otomatis valid sebagai bukti; validasi format dan tampilkan untuk
pemeriksaan admin.

### 9.4 `reseller_pricelists`

-   `id uuid primary key`.
-   `reseller_id uuid references reseller_details(id)`.
-   `file_path text not null`.
-   `created_at timestamptz`.

### 9.5 `product_categories`

-   `id uuid primary key`.
-   `name text not null`.
-   `slug text unique not null`.
-   `sort_order integer default 0`.
-   `is_active boolean default true`.
-   `created_at timestamptz`.
-   `updated_at timestamptz`.

### 9.6 `products`

-   `id uuid primary key`.
-   `category_id uuid nullable references product_categories(id)`.
-   `name text not null`.
-   `slug text unique not null`.
-   `description text nullable`.
-   `image_path text nullable`.
-   `reseller_price numeric(14,2) not null`.
-   `is_active boolean default true`.
-   `sort_order integer default 0`.
-   `created_at timestamptz`.
-   `updated_at timestamptz`.

Jangan membuat tabel harga bertingkat reseller pada versi pertama karena
semua reseller menggunakan harga yang sama.

### 9.7 `menus`

-   `id uuid primary key`.
-   `title text not null`.
-   `description text nullable`.
-   `icon text nullable`.
-   `action_type text not null`.
-   `target_url text nullable`.
-   `is_active boolean default true`.
-   `sort_order integer default 0`.
-   `created_at timestamptz`.
-   `updated_at timestamptz`.

### 9.8 `banners`

-   `id uuid primary key`.
-   `title text nullable`.
-   `description text nullable`.
-   `image_path text not null`.
-   `button_label text nullable`.
-   `target_url text nullable`.
-   `sort_order integer default 0`.
-   `is_active boolean default true`.
-   `starts_at timestamptz nullable`.
-   `ends_at timestamptz nullable`.
-   `created_at timestamptz`.
-   `updated_at timestamptz`.

### 9.9 `telegram_settings`

Dapat berupa satu record konfigurasi aktif: - `id uuid primary key`. -
`channel_name text`. - `description text nullable`. -
`channel_url text`. - `is_active boolean default true`. -
`updated_at timestamptz`.

Batasi perubahan hanya untuk admin.

### 9.10 `warranty_claims`

-   `id uuid primary key`.
-   `claim_code text unique not null`.
-   `reseller_id uuid not null references profiles(id)`.
-   `order_date date not null`.
-   `report_date timestamptz not null default now()`.
-   `application text not null`.
-   `remaining_duration_value numeric nullable`.
-   `remaining_duration_unit text nullable`.
-   `remaining_duration_source text nullable` --- misalnya `manual`,
    `internal_calculation`, atau `external_verified`.
-   `account_email text nullable`.
-   `profile_reference text nullable` --- username atau URL profil,
    bukan password.
-   `problem_description text not null`.
-   `status text not null default 'submitted'`.
-   `created_at timestamptz`.
-   `updated_at timestamptz`.

Jangan menambahkan kolom password atau PIN. Jangan menyimpan kredensial
aplikasi dalam bentuk plaintext, terenkripsi, atau metadata lain pada
versi awal.

Tanggal report harus ditetapkan server. Reseller tidak boleh mengubah
tanggal report untuk memanipulasi urutan laporan.

### 9.11 `warranty_responses`

-   `id uuid primary key`.
-   `claim_id uuid not null references warranty_claims(id)`.
-   `admin_id uuid not null references profiles(id)`.
-   `response text nullable` --- terlihat reseller.
-   `internal_note text nullable` --- admin saja.
-   `old_status text nullable`.
-   `new_status text nullable`.
-   `created_at timestamptz`.

### 9.12 `warranty_attachments`

-   `id uuid primary key`.
-   `claim_id uuid not null references warranty_claims(id)`.
-   `file_path text not null`.
-   `file_name text nullable`.
-   `mime_type text nullable`.
-   `created_at timestamptz`.

### 9.13 `site_settings`

-   `id uuid primary key`.
-   `key text unique not null`.
-   `value jsonb not null`.
-   `updated_at timestamptz`.

### 9.14 `admin_activity_logs`

-   `id uuid primary key`.
-   `actor_id uuid references profiles(id)`.
-   `action text not null`.
-   `entity_type text not null`.
-   `entity_id uuid nullable`.
-   `metadata jsonb nullable`.
-   `created_at timestamptz`.

Metadata harus bebas dari password, token, PIN, dan rahasia lainnya.

------------------------------------------------------------------------

## 10. Supabase Storage

Buat bucket dengan kebijakan akses yang sesuai.

  -----------------------------------------------------------------------
  Bucket                  Akses                   Isi
  ----------------------- ----------------------- -----------------------
  `public-assets`         Public read, admin      Logo, banner, gambar
                          write                   produk

  `reseller-evidence`     Private                 Screenshot testimoni
                                                  dan pricelist reseller

  `warranty-evidence`     Private                 Lampiran laporan
                                                  garansi
  -----------------------------------------------------------------------

Ketentuan: - Gunakan path yang terstruktur, misalnya
`{user_id}/{uuid}-{filename}`. - Validasi MIME type dan ukuran file. -
Hindari nama file asli sebagai satu-satunya identifier. - Gunakan signed
URL dengan masa berlaku terbatas untuk file privat. - Reseller hanya
dapat upload/melihat file miliknya sesuai kebutuhan. - Admin dapat
mengakses file privat untuk pemeriksaan. - Jangan membuat bucket bukti
reseller atau garansi menjadi public.

------------------------------------------------------------------------

## 11. Keamanan dan RLS

RLS wajib diaktifkan pada tabel yang dapat diakses client.

Aturan minimum:

  -----------------------------------------------------------------------
  Resource          Pengunjung        Reseller          Admin
  ----------------- ----------------- ----------------- -----------------
  Menu aktif        Read              Read              CRUD

  Banner aktif      Read              Read              CRUD

  Produk aktif      Read sesuai       Read              CRUD
                    konfigurasi                         
                    katalog                             

  Profil sendiri    ---               Read/update field Read/manage
                                      yang diizinkan    

  Profil reseller   ---               Denied            Read/manage
  lain                                                  

  Bukti pendaftaran ---               Akses terbatas    Read
  sendiri                                               

  Pendaftaran       Create            Read milik        Read/manage
  reseller                            sendiri           

  Laporan garansi   Create hanya      CRUD terbatas     Read/manage
                    melalui alur      milik sendiri     
                    tervalidasi                         

  Tanggapan garansi ---               Read milik        Create/manage
                                      sendiri           

  Pengaturan        ---               Read aktif jika   CRUD
  Telegram                            diperlukan        

  Activity log      ---               ---               Read
  -----------------------------------------------------------------------

Catatan implementasi: - Gunakan helper untuk memeriksa role dari sumber
yang tidak dapat dimanipulasi pengguna. - Jangan mempercayai
`user_metadata` yang dapat diedit pengguna untuk menentukan role. -
Pertimbangkan custom claims atau tabel profil dengan kebijakan RLS yang
aman. - Hindari policy rekursif pada tabel `profiles`. - Fungsi database
`SECURITY DEFINER` harus menggunakan `search_path` yang aman dan
privilege minimum. - Endpoint admin wajib memverifikasi sesi dan role. -
Terapkan rate limiting pada pendaftaran, login, reset password, dan
pembuatan laporan. - Sanitasi input dan cegah XSS, CSRF sesuai pola
framework, SQL injection, serta open redirect. - Gunakan audit log untuk
tindakan penting. - Jangan pernah menampilkan stack trace atau detail
rahasia kepada pengguna.

------------------------------------------------------------------------

## 12. Struktur Route dan Halaman

### Public

  Route                Fungsi
  -------------------- ------------------------------------------------------
  `/`                  Homepage
  `/register`          Pendaftaran reseller
  `/login`             Login
  `/forgot-password`   Permintaan reset password
  `/reset-password`    Form password baru
  `/pricelist`         Katalog publik jika diaktifkan oleh keputusan produk
  `/channel`           Redirect Telegram atau halaman informasi
  `/privacy-policy`    Kebijakan privasi
  `/terms`             Ketentuan penggunaan

### Reseller

  Route                           Fungsi
  ------------------------------- ---------------------------
  `/dashboard`                    Ringkasan reseller
  `/dashboard/pricelist`          Pricelist
  `/dashboard/pricelist/[slug]`   Detail produk
  `/dashboard/garansi`            Form laporan garansi
  `/dashboard/garansi/[id]`       Detail dan status laporan
  `/dashboard/riwayat-garansi`    Riwayat laporan
  `/dashboard/profil`             Profil reseller
  `/dashboard/pengaturan`         Pengaturan akun

### Admin

  Route                      Fungsi
  -------------------------- ---------------------
  `/admin/login`             Login admin
  `/admin`                   Dashboard admin
  `/admin/resellers`         Daftar reseller
  `/admin/resellers/[id]`    Detail reseller
  `/admin/products`          Produk
  `/admin/categories`        Kategori
  `/admin/warranties`        Laporan garansi
  `/admin/warranties/[id]`   Detail laporan
  `/admin/menus`             Menu homepage
  `/admin/banners`           Banner
  `/admin/telegram`          Pengaturan Telegram
  `/admin/settings`          Pengaturan website
  `/admin/admins`            Pengelolaan admin
  `/admin/activity-logs`     Riwayat aktivitas

------------------------------------------------------------------------

## 13. Struktur Folder yang Disarankan

``` text
peony/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── register/
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── pricelist/
│   │   │   ├── garansi/
│   │   │   ├── riwayat-garansi/
│   │   │   ├── profil/
│   │   │   └── pengaturan/
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   ├── resellers/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── warranties/
│   │   │   ├── menus/
│   │   │   ├── banners/
│   │   │   ├── telegram/
│   │   │   ├── settings/
│   │   │   ├── admins/
│   │   │   └── activity-logs/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── public/
│   │   ├── reseller/
│   │   ├── admin/
│   │   └── forms/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── validation/
│   │   └── utils/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── config/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Agent boleh menyesuaikan struktur folder jika ada alasan teknis, tetapi
pertahankan pemisahan tanggung jawab dan dokumentasikan perubahan.

------------------------------------------------------------------------

## 14. Environment Variables

Sediakan `.env.example` tanpa nilai rahasia:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Ketentuan: - Isi `.env.local` hanya di lingkungan lokal. - Tambahkan
environment variables yang diperlukan pada Vercel. - Jangan commit
`.env.local`. - Jangan menaruh service role key pada variabel
`NEXT_PUBLIC_`. - Gunakan URL production yang benar untuk callback
Auth. - Konfigurasikan allowed redirect URLs di Supabase Auth.

------------------------------------------------------------------------

## 15. Deployment Vercel

Checklist deployment: 1. Push project ke repository Git. 2. Import
repository ke Vercel. 3. Atur framework Next.js. 4. Masukkan environment
variables. 5. Jalankan seluruh Supabase migrations pada project Supabase
yang benar. 6. Buat bucket Storage dan policies. 7. Konfigurasikan Site
URL dan Redirect URLs Supabase Auth. 8. Deploy. 9. Uji pendaftaran,
login, reset password, upload, RLS, dashboard, export, dan akses admin.
10. Hubungkan custom domain jika tersedia.

Jangan menganggap deployment berhasil hanya karena build sukses. Lakukan
pengujian end-to-end di environment production.

------------------------------------------------------------------------

## 16. Tahapan Implementasi untuk AI Agent

Kerjakan secara bertahap. Jangan membuat semua fitur sekaligus tanpa
menguji fondasinya.

### Tahap 0 --- Pemeriksaan dan perencanaan

-   Periksa repository dan file yang sudah tersedia.
-   Jika project sudah ada, jangan menimpa konfigurasi atau kode yang
    masih digunakan.
-   Buat rencana implementasi dan daftar file yang akan dibuat/diubah.
-   Identifikasi versi dependency yang kompatibel.
-   Catat keputusan yang belum jelas.

### Tahap 1 --- Fondasi project dan desain

-   Setup Next.js App Router, TypeScript, Tailwind CSS.
-   Buat design tokens Peony.
-   Buat layout public, reseller, dan admin.
-   Implementasikan homepage responsif mengikuti referensi.
-   Gunakan data sementara hanya untuk pengembangan UI dan beri label
    jelas.

### Tahap 2 --- Database dan keamanan

-   Buat migration SQL untuk seluruh tabel.
-   Buat relasi, index, constraint, dan trigger `updated_at` bila
    diperlukan.
-   Buat RLS policies.
-   Buat Storage buckets dan policies.
-   Buat Supabase server/browser clients.
-   Buat seed data minimum untuk pengembangan.
-   Uji bahwa reseller tidak dapat membaca data reseller lain.

### Tahap 3 --- Authentication dan pendaftaran

-   Implementasikan register dan login.
-   Buat profil dan reseller details.
-   Implementasikan upload minimal tiga bukti testimoni dan satu
    screenshot pricelist.
-   Terapkan pendaftaran otomatis.
-   Implementasikan logout dan reset password.
-   Uji duplikasi email dan kegagalan upload/proses parsial.

### Tahap 4 --- Dashboard reseller

-   Buat dashboard ringkasan.
-   Buat profil.
-   Buat katalog pricelist.
-   Buat form garansi.
-   Buat daftar dan detail laporan.
-   Implementasikan status serta tanggapan admin.
-   Pastikan data selalu dibatasi berdasarkan user yang login.

### Tahap 5 --- Admin dashboard

-   Buat dashboard statistik dari data aktual.
-   Implementasikan CRUD reseller.
-   Implementasikan CRUD produk dan kategori.
-   Implementasikan manajemen laporan garansi.
-   Implementasikan manajemen menu dan banner.
-   Implementasikan pengaturan Telegram dan website.
-   Implementasikan activity log.

### Tahap 6 --- Export dan kalkulasi

-   Buat export Excel reseller.
-   Buat export Excel laporan garansi.
-   Pastikan data sensitif tidak ikut diekspor.
-   Teliti aturan kalkulasi sisa durasi.
-   Integrasikan API resmi WebRefund hanya jika tersedia dan diizinkan;
    jika tidak, sediakan tautan eksternal dan kalkulator internal
    berdasarkan aturan yang telah disetujui.

### Tahap 7 --- QA dan deployment

-   Jalankan lint dan type check.
-   Jalankan build production.
-   Uji semua route dan role.
-   Uji RLS dan Storage.
-   Uji responsive mobile/desktop.
-   Uji file upload dan export.
-   Uji error handling.
-   Deploy ke Vercel dan lakukan smoke test.

Setiap tahap harus menghasilkan kode yang dapat dijalankan dan diuji
sebelum melanjutkan.

------------------------------------------------------------------------

## 17. Kriteria Penerimaan (Acceptance Criteria)

Project dianggap memenuhi kebutuhan awal apabila:

### Public dan pendaftaran

-   [ ] Homepage sesuai identitas visual Peony.
-   [ ] Menu homepage berasal dari database.
-   [ ] Admin dapat mengubah urutan dan visibilitas menu.
-   [ ] Form pendaftaran memiliki semua field reseller yang ditentukan.
-   [ ] Testimoni minimal tiga bukti.
-   [ ] Screenshot pricelist wajib diunggah.
-   [ ] Akun reseller dibuat melalui Supabase Auth.
-   [ ] Pendaftaran otomatis aktif sesuai konfigurasi autentikasi.
-   [ ] Reseller dapat login setelah pendaftaran berhasil.

### Pricelist

-   [ ] Semua reseller melihat harga yang sama.
-   [ ] Admin dapat CRUD produk dan kategori.
-   [ ] Produk nonaktif tidak tampil.
-   [ ] Pencarian dan filter kategori bekerja.

### Garansi

-   [ ] Reseller dapat mengirim laporan.
-   [ ] Nama reseller dan tanggal report ditentukan dari sesi/server.
-   [ ] Password dan PIN tidak diminta atau disimpan.
-   [ ] Admin dapat memproses dan memberi tanggapan.
-   [ ] Reseller hanya dapat melihat laporan miliknya.
-   [ ] Status laporan dapat dipantau.
-   [ ] Attachment bersifat privat.

### Admin

-   [ ] Admin dapat mengelola reseller.
-   [ ] Admin dapat mengelola produk dan harga.
-   [ ] Admin dapat mengelola laporan garansi.
-   [ ] Admin dapat mengelola menu homepage.
-   [ ] Admin dapat mengelola banner.
-   [ ] Admin dapat mengubah link Telegram.
-   [ ] Admin dapat export data Excel.
-   [ ] Aktivitas penting tercatat.

### Keamanan dan deployment

-   [ ] RLS aktif dan diuji.
-   [ ] Service role key tidak terekspos.
-   [ ] Role tidak dapat dimanipulasi pengguna.
-   [ ] Tidak ada kredensial rahasia di repository.
-   [ ] Build production berhasil.
-   [ ] Aplikasi berjalan di Vercel.
-   [ ] Alur Auth production sudah diuji.

------------------------------------------------------------------------

## 18. Asumsi dan Keputusan yang Perlu Dikonfirmasi

Jangan mengarang jawaban untuk hal-hal berikut. Implementasikan dengan
konfigurasi yang mudah diubah atau minta konfirmasi pemilik proyek.

1.  **Nama BA:** gunakan label "Nama BA" sesuai input pengguna. Jangan
    mengubahnya menjadi istilah lain tanpa konfirmasi.
2.  **Awal BA:** dianggap tahun mulai menjadi BA, bukan tanggal lengkap.
3.  **Bukti testimoni:** minimal tiga bukti dalam tiga bulan terakhir;
    pemilik perlu menentukan apakah tanggal bukti wajib diisi atau cukup
    terlihat pada screenshot/link.
4.  **Pricelist reseller:** satu screenshot pricelist wajib; harga pada
    screenshot tidak boleh underprice.
5.  **Pendaftaran otomatis:** akun aktif langsung tanpa approval admin.
    Admin tetap dapat menonaktifkan akun setelahnya.
6.  **Akses pricelist:** keputusan akhir apakah katalog dapat dilihat
    publik atau hanya setelah login belum ditetapkan secara eksplisit.
    Default yang disarankan: homepage menampilkan tombol pricelist,
    tetapi isi katalog penuh hanya dapat diakses setelah login.
7.  **Form garansi:** password dan PIN tidak dikumpulkan.
    `profile_reference` menampung username/URL profil.
8.  **Sisa durasi:** formula, satuan, dan aturan tiap aplikasi perlu
    dikonfirmasi. Jangan membuat formula bisnis sendiri.
9.  **WebRefund:** belum ada API resmi yang terverifikasi. Jangan
    mengklaim integrasi otomatis sebelum dokumentasi dan akses API
    tersedia.
10. **Aplikasi garansi:** daftar aplikasi sebaiknya dapat dikelola
    admin, tetapi daftar awal belum diberikan.
11. **Nomor WhatsApp:** wajib untuk kontak operasional; format dan
    validasi nomor Indonesia perlu diterapkan.
12. **Kebijakan garansi:** masa berlaku, syarat bukti, alasan penolakan,
    dan SLA penanganan belum ditentukan.
13. **Banner:** desain, ukuran, dan jumlah banner belum ditentukan; buat
    fleksibel dan responsive.

------------------------------------------------------------------------

## 19. Instruksi Kerja untuk AI Agent

Saat mengerjakan project:

1.  Baca dokumen ini secara menyeluruh sebelum menulis kode.
2.  Periksa kondisi repository terlebih dahulu.
3.  Jangan hanya membuat mockup; implementasikan alur yang benar-benar
    terhubung ke Supabase.
4.  Jangan mengarang kredensial, API, harga, produk, data reseller, atau
    aturan bisnis.
5.  Jangan menyimpan password atau PIN akun aplikasi pada form garansi.
6.  Jangan mengekspos service role key.
7.  Buat SQL migrations dan dokumentasikan cara menjalankannya.
8.  Gunakan validasi client dan server.
9.  Terapkan RLS dan uji akses antar-role.
10. Gunakan komponen reusable dan hindari duplikasi kode.
11. Berikan loading, error, empty, dan success state.
12. Pastikan UI mobile-first dan mengikuti identitas visual Peony.
13. Jangan menyatakan fitur selesai jika belum diuji.
14. Setelah setiap tahap, laporkan file yang dibuat/diubah, fitur yang
    selesai, pengujian yang dijalankan, dan kendala yang masih ada.
15. Jika ada keputusan yang berpengaruh pada keamanan atau aturan
    bisnis, berhenti dan minta konfirmasi daripada membuat asumsi
    berisiko.

**Prioritas utama:** keamanan data reseller, pemisahan hak akses,
pendaftaran otomatis yang berfungsi, katalog harga yang konsisten, dan
proses laporan garansi yang dapat dilacak.
