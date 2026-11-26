# Rencana Integrasi Notifikasi Telegram Peony

## Status

Dokumen ini hanya merupakan rencana implementasi. Integrasi Telegram belum diaktifkan dan belum ada perubahan pada alur produksi.

## Tujuan

Menambahkan notifikasi Telegram untuk:

1. Memberi tahu admin ketika ada laporan garansi baru.
2. Memberi tahu admin ketika status laporan diperbarui.
3. Opsional pada tahap berikutnya: memberi tahu reseller melalui Telegram ketika laporan diperbarui.

Telegram hanya berfungsi sebagai kanal notifikasi. Database Supabase tetap menjadi sumber data utama.

## Rekomendasi Tahap Awal

Implementasikan notifikasi satu arah ke grup atau channel admin terlebih dahulu.

Alur laporan baru:

```text
Reseller mengirim laporan
-> laporan dan attachment berhasil disimpan di Supabase
-> notification_outbox dibuat
-> worker mencoba mengirim notifikasi ke Telegram admin
-> hasil pengiriman dicatat
```

Alur perubahan status:

```text
Admin memperbarui status dan tanggapan
-> transaksi database berhasil
-> notification_outbox dibuat
-> worker mengirim notifikasi ke Telegram admin
-> reseller tetap menerima informasi melalui dashboard/WhatsApp
```

Kegagalan Telegram tidak boleh membatalkan laporan atau perubahan status.

## Kompatibilitas Vercel

Telegram Bot API kompatibel dengan Vercel karena menggunakan request HTTPS biasa.

Gunakan:

- Next.js Route Handler untuk endpoint pengiriman/worker.
- Vercel Cron untuk memproses outbox secara berkala.
- Webhook Telegram jika kelak bot perlu menerima command atau proses koneksi akun reseller.

Jangan gunakan long polling karena Vercel Functions bersifat stateless dan memiliki batas waktu eksekusi.

## Environment Variables

Tambahkan hanya saat implementasi dimulai:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
CRON_SECRET=
```

Ketentuan:

- Jangan menggunakan prefix `NEXT_PUBLIC_`.
- Simpan nilai production di Vercel Environment Variables.
- Jangan menulis token di source code, database, activity log, atau pesan error.
- Gunakan token berbeda untuk development dan production bila memungkinkan.

## Data Yang Boleh Dikirim

Notifikasi admin boleh berisi:

- Kode laporan.
- Nama reseller.
- Nama aplikasi.
- Tanggal order dan report.
- Status laporan.
- Nama admin handler.
- Ringkasan kendala yang sudah disanitasi.
- Link menuju dashboard admin.

Notifikasi tidak boleh berisi:

- Password atau PIN.
- Token autentikasi.
- Data akun lengkap.
- Signed URL attachment.
- Service role key.
- Telegram bot token.
- Informasi rahasia lain.

## Template Notifikasi Admin

### Laporan Baru

```text
Laporan Garansi Baru

Kode: PNY-XXXX
Reseller: Nama Reseller
Aplikasi: Nama Aplikasi
Tanggal order: DD-MM-YYYY
Sisa durasi: XX hari
Status: Diperiksa

Buka dashboard:
https://domain-peony.com/admin/warranties
```

### Perubahan Status

```text
Update Garansi

Kode: PNY-XXXX
Reseller: Nama Reseller
Admin handler: Rain
Status: Diperiksa -> On Proses

Buka dashboard:
https://domain-peony.com/admin/warranties
```

## Rancangan Database

Tambahkan tabel outbox agar pengiriman dapat diulang tanpa memengaruhi transaksi utama.

```sql
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  channel text not null default 'telegram',
  recipient_key text not null,
  payload jsonb not null,
  idempotency_key text unique not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Status yang disarankan:

- `pending`
- `processing`
- `sent`
- `failed`

Ketentuan payload:

- Payload harus sudah dibatasi ke data yang aman dikirim.
- Jangan menyimpan data akun lengkap atau attachment URL.
- `last_error` tidak boleh memuat token, header request, atau stack trace rahasia.

## RLS dan Izin

- Reseller tidak dapat membaca atau mengubah outbox.
- Admin hanya boleh membaca status notifikasi bila diperlukan.
- Insert outbox dilakukan oleh fungsi database atau server terpercaya.
- Worker menggunakan server-side credential dan tidak mengekspos service role ke browser.
- Fungsi `SECURITY DEFINER` harus memakai `search_path` aman dan privilege minimum.

## Worker Pengiriman

Route yang disarankan:

```text
POST /api/cron/telegram-notifications
```

Alur worker:

1. Verifikasi `Authorization: Bearer CRON_SECRET`.
2. Ambil sejumlah kecil outbox `pending` yang waktunya sudah jatuh tempo.
3. Kunci record agar tidak diproses worker lain.
4. Kirim request ke Telegram Bot API dengan timeout 3-5 detik.
5. Tandai `sent` jika berhasil.
6. Tambah `attempts` dan jadwalkan retry jika gagal.
7. Tandai `failed` permanen setelah batas retry tercapai.

Retry yang disarankan:

```text
Percobaan 1: langsung
Percobaan 2: +1 menit
Percobaan 3: +5 menit
Percobaan 4: +30 menit
Percobaan 5: +2 jam
```

Gunakan `idempotency_key` agar event yang sama tidak membuat pesan ganda.

## Konfigurasi Vercel Cron

Contoh rencana `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/telegram-notifications",
      "schedule": "* * * * *"
    }
  ]
}
```

Frekuensi akhir harus disesuaikan dengan batas paket Vercel yang digunakan.

## Tahap Implementasi

### Tahap 1 - Bot dan Grup Admin

- Buat bot melalui BotFather.
- Tambahkan bot ke grup/channel admin.
- Ambil chat ID admin dengan metode aman.
- Simpan token dan chat ID di environment development.
- Uji pengiriman pesan sederhana dari route server lokal.

### Tahap 2 - Outbox Database

- Buat migration tabel `notification_outbox`.
- Tambahkan index status dan waktu retry.
- Terapkan RLS.
- Buat helper/fungsi untuk membuat event secara idempotent.
- Pastikan payload bebas data sensitif.

### Tahap 3 - Event Garansi

- Tambahkan event `warranty.created` setelah laporan tersimpan lengkap.
- Tambahkan event `warranty.status_changed` dalam transaksi RPC proses garansi.
- Pastikan kegagalan pembuatan notifikasi tidak merusak data utama, atau gunakan transaksi/outbox yang sesuai.

### Tahap 4 - Worker Telegram

- Buat client Telegram server-only.
- Tambahkan timeout dan sanitasi error.
- Buat route cron dengan verifikasi secret.
- Implementasikan retry dan locking.
- Catat hasil pengiriman tanpa menyimpan token.

### Tahap 5 - Dashboard Monitoring

- Opsional: tampilkan jumlah notifikasi pending/failed.
- Tambahkan retry manual hanya untuk admin berwenang.
- Jangan tampilkan token atau raw request Telegram.

### Tahap 6 - Deployment dan QA

- Atur environment variables di Vercel.
- Deploy migration ke Supabase production.
- Aktifkan Vercel Cron.
- Uji laporan baru, update status, retry, dan duplicate prevention.
- Uji bahwa Telegram gagal tidak membatalkan transaksi garansi.

## Tahap Lanjutan: Telegram Reseller

Telegram tidak dapat mengirim pesan ke reseller hanya berdasarkan username. Bot memerlukan `chat_id`, dan reseller harus lebih dulu menekan `Start`.

Alur yang disarankan:

```text
Dashboard reseller
-> klik Hubungkan Telegram
-> server membuat token acak sekali pakai
-> reseller membuka https://t.me/NamaBot?start=TOKEN
-> Telegram webhook menerima token dan chat_id
-> server memverifikasi token
-> chat_id dikaitkan ke user
```

Tambahan data yang diperlukan:

```text
telegram_chat_id
telegram_connected_at
telegram_connection_tokens
```

Token koneksi harus:

- Acak dan sulit ditebak.
- Sekali pakai.
- Memiliki masa berlaku singkat.
- Disimpan dalam bentuk hash.
- Tidak berisi user ID, email, atau data pribadi mentah.

Webhook yang disarankan:

```text
POST /api/telegram/webhook
```

Webhook harus memverifikasi `TELEGRAM_WEBHOOK_SECRET`.

## Observability

Pantau minimal:

- Jumlah notifikasi pending.
- Jumlah berhasil.
- Jumlah gagal.
- Rata-rata waktu pengiriman.
- Jumlah retry.
- Error rate Telegram API.

Jangan mencatat:

- Bot token.
- Authorization header.
- Data akun reseller.
- Signed URL.
- Payload sensitif.

## Acceptance Criteria Tahap Awal

- [ ] Laporan garansi tetap berhasil ketika Telegram tidak tersedia.
- [ ] Laporan baru menghasilkan satu notifikasi admin.
- [ ] Perubahan status menghasilkan satu notifikasi admin.
- [ ] Pesan tidak memuat data akun atau attachment privat.
- [ ] Bot token tidak tersedia di browser atau source code.
- [ ] Outbox memiliki idempotency key.
- [ ] Retry berjalan dengan batas percobaan.
- [ ] Route cron menolak request tanpa secret yang valid.
- [ ] Activity log dan notification log tidak menyimpan secret.
- [ ] Integrasi berjalan pada Vercel tanpa long polling.

## Keputusan Sebelum Eksekusi

Konfirmasi hal berikut sebelum implementasi:

1. Apakah notifikasi tahap awal hanya untuk grup admin?
2. Grup atau channel Telegram mana yang digunakan?
3. Domain production yang akan dimasukkan ke link dashboard?
4. Berapa frekuensi cron yang didukung paket Vercel?
5. Berapa batas retry dan masa simpan notification log?
6. Apakah reseller tetap menerima update melalui WhatsApp pada tahap awal?
7. Apakah fitur koneksi Telegram reseller diperlukan pada tahap berikutnya?

## Rekomendasi Final

Mulai dari notifikasi grup admin menggunakan outbox dan Vercel Cron. Pertahankan WhatsApp sebagai kanal update reseller sampai fitur koneksi Telegram reseller dan webhook siap. Pendekatan ini paling sederhana, aman, dapat di-retry, dan kompatibel dengan arsitektur Vercel.
