export default function AdminHeader({ backHref = '/admin', name = '' }) {
  return (
    <>
      {/* Red accent bar */}
      <div className="w-full h-1 bg-red-600" />

      {/* Header */}
      <header className="border-b border-black px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
          <span className="text-xs font-black tracking-widest text-white bg-red-600 px-2 py-1">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-8">
          {name && <span className="text-sm text-gray-600">{name}</span>}
          <a
            href={backHref}
            className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
          >
            BACK
          </a>
        </div>
      </header>
    </>
  )
}
