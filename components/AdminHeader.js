export default function AdminHeader({ backHref = '/admin', name = '', onBack = null, courseName = 'Writing 101' }) {
  return (
    <>
      {/* Course editing banner */}
      <div className="w-full bg-red-600 px-8 py-2 flex items-center justify-center">
        <p className="text-xs font-black tracking-widest uppercase text-white">
          Editing Course — {courseName}
        </p>
      </div>
      {/* Header */}
      <header className="border-b border-black px-8 py-6 flex items-center justify-between bg-gray-100">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
          <span className="text-xs font-black tracking-widest text-white bg-red-600 px-2 py-1">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-8">
          {name && <span className="text-sm text-gray-600">{name}</span>}
          {onBack ? (
            <button
              onClick={onBack}
              className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
              BACK
            </button>
          ) : (
            <a
              href={backHref}
              className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
              BACK
            </a>
          )}
        </div>
      </header>
    </>
  )
}