'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [view, setView]           = useState('signin') // 'signin' | 'reset' | 'sent'
  const router                    = useRouter()
  const supabase                  = createClient()
  const requestId                 = useRef(0)

  function switchView(next) {
    requestId.current += 1
    setError(null)
    setLoading(false)
    setView(next)
  }

  async function handleLogin(e) {
    e.preventDefault()
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (id !== requestId.current) return
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/courses')
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (id !== requestId.current) return
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setLoading(false)
    setView('sent')
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black text-black mb-8 tracking-tight">GESSO</h1>

        {view === 'sent' ? (
          <div>
            <p className="text-sm text-gray-600 mb-6">
              Password reset email sent. Check your inbox and follow the link to reset your password.
            </p>
            <button onClick={() => switchView('signin')}
              className="text-sm text-black font-bold underline">
              Back to sign in
            </button>
          </div>
        ) : view === 'reset' ? (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">Enter your email and we'll send you a reset link.</p>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="border border-black p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="bg-black text-white p-3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
            <button type="button" onClick={() => switchView('signin')}
              className="text-sm text-gray-600 underline">
              Back to sign in
            </button>
          </form>
        ) : (
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
        )}

        {view === 'signin' && (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-sm text-gray-600">
              No account?{' '}
              <a href="/register" className="text-black font-bold underline">Register here</a>
            </p>
            <button onClick={() => switchView('reset')}
              className="text-sm text-gray-600 underline text-left">
              Forgot password?
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
