export default function DashboardLoading() {
  return <div className="mx-auto max-w-6xl animate-pulse p-5 sm:p-8">
    <div className="h-3 w-24 rounded-full bg-pink-100" />
    <div className="mt-4 h-10 w-72 rounded-xl bg-gray-200" />
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div className="h-28 rounded-[22px] bg-white shadow-sm" key={item} />)}</div>
    <div className="mt-8 h-64 rounded-[22px] bg-white shadow-sm" />
  </div>;
}
