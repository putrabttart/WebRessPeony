import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#0b0709] p-6 text-center text-white"><div><p className="text-sm tracking-[.3em] text-pink-300">404</p><h1 className="display mt-3 text-5xl">Halaman tidak ditemukan</h1><Link className="btn-secondary mt-8 text-black" href="/">Kembali ke beranda</Link></div></main>;
}
