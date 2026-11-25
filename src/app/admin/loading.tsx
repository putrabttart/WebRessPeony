export default function AdminLoading() {
  return <div className="mx-auto max-w-7xl animate-pulse p-5 sm:p-8">
    <div className="h-3 w-28 rounded-full bg-pink-100" />
    <div className="mt-4 h-10 w-64 rounded-xl bg-gray-200" />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="h-28 rounded-[22px] bg-white shadow-sm" key={item} />)}</div>
    <div className="mt-7 h-72 rounded-[22px] bg-white shadow-sm" />
  </div>;
}
