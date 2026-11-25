import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 font-mono selection:bg-neutral-800">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-bold tracking-tighter text-neutral-200">404</h1>
        <h2 className="text-sm uppercase tracking-widest text-neutral-400">Resource Not Found</h2>
        <p className="text-xs text-neutral-500">
          The requested endpoint does not exist or has been removed from this server.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-xs uppercase tracking-wider rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
