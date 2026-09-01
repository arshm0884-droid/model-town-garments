const galleryItems = [
  {
    title: "New Arrivals",
    subtitle: "Fresh styles for every season",
    icon: "✦",
  },
  {
    title: "Men's Collection",
    subtitle: "Shirts · Tees · Jeans · Trousers",
    icon: "👔",
  },
  {
    title: "Denim Edit",
    subtitle: "Everyday fits, made to move",
    icon: "👖",
  },
  {
    title: "Premium Styles",
    subtitle: "Smart looks for every occasion",
    icon: "✧",
  },
  {
    title: "Jackets",
    subtitle: "Layer up in style",
    icon: "🧥",
  },
  {
    title: "Store Collection",
    subtitle: "Explore Model Town Garments",
    icon: "MT",
  },
];

export default function Gallery() {
  return (
    <section id="gallery" className="bg-[#f8f9fb] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs font-black tracking-[0.28em] text-[#2563eb]">
              STYLE GALLERY
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              See the collection.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-500">
            A visual preview of the Model Town Garments collection.
            Actual store and product photos can be added later.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {galleryItems.map((item, index) => (
            <div
              key={item.title}
              className={`group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                index === 0 || index === 5
                  ? "sm:col-span-2 lg:col-span-2"
                  : ""
              }`}
            >
              <div
                className={`relative flex items-end overflow-hidden bg-gradient-to-br from-[#dce6f2] via-[#f8fafc] to-[#c8d5e6] ${
                  index === 0 || index === 5
                    ? "min-h-[300px]"
                    : "min-h-[260px]"
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(37,99,235,0.16),transparent_38%)] transition duration-500 group-hover:scale-110" />

                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-white/75 text-5xl shadow-lg backdrop-blur-md transition duration-300 group-hover:scale-110">
                    {item.icon}
                  </div>

                  <div className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Demo Visual
                  </div>
                </div>

                <div className="relative z-10 w-full bg-gradient-to-t from-black/65 via-black/20 to-transparent p-5 pt-16 text-white">
                  <div className="text-lg font-black">
                    {item.title}
                  </div>

                  <div className="mt-1 text-xs text-white/70">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center text-xs font-semibold text-blue-700">
          Demo gallery · Actual product and store photographs can be added
          to the final website.
        </div>
      </div>
    </section>
  );
}
