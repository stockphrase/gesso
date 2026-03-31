export default function Header({ backHref = '/dashboard', name = '', showBack = true }) {
  return (
    <header className="border-b border-black px-8 py-6 flex items-center justify-between">
      <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
      <div className="flex items-center gap-8">
        {name && <span className="text-sm text-gray-600">{name}</span>}
        {showBack && (
          <a
            href={backHref}
            className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
          >
            BACK
          </a>
        )}
      </div>
    </header>
  )
}
