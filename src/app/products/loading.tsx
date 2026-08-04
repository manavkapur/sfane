export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5f2_0%,#f4eee8_52%,#f8f4f0_100%)] px-4 pb-20 pt-12 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-6xl animate-pulse">
        <div className="h-60 rounded-[32px] border border-[#e7dacf] bg-white/65 p-6 md:p-9">
          <div className="h-3 w-20 rounded-full bg-[#e8d8cc]" />
          <div className="mt-5 h-11 max-w-lg rounded-xl bg-[#eaded5]" />
          <div className="mt-4 h-4 max-w-md rounded-full bg-[#eee4dd]" />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-[410px] rounded-[28px] border border-[#eaded3] bg-white/70" />
          ))}
        </div>
        <p className="mt-6 text-center text-sm font-medium text-[#6a4b36]">Loading products…</p>
      </div>
    </div>
  );
}
