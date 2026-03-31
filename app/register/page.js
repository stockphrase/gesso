'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const router                  = useRouter()
  const supabase                = createClient()

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Sign up with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black text-black mb-8 tracking-tight">
          GESSO
        </h1>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="border border-black p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-black p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border border-black p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white p-3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </form>
        <p className="mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-black font-bold underline">
            Sign in here
          </a>
        </p>
      </div>
    </main>
  )
}
