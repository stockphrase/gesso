'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const router                  = useRouter()
  const supabase                = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/courses')
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black text-black mb-8 tracking-tight">GESSO</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="border border-black p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black" />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            className="border border-black p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-black text-white p-3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
        <p className="mt-6 text-sm text-gray-600">
          No account?{' '}
          <a href="/register" className="text-black font-bold underline">Register here</a>
        </p>
      </div>
    </main>
  )
}
