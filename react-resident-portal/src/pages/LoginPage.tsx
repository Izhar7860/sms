import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth } from '../services/firebase/firebaseClient'
import { useAuthUser } from '../hooks/useAuthUser'

type LoginMode = 'signin' | 'reset'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, error } = useAuthUser()

  const [mode, setMode] = useState<LoginMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<{ variant: 'info' | 'success' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname || '/resident'
  }, [location.state])

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true })
    }
  }, [from, loading, navigate, user])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setStatus({ variant: 'error', message: 'Enter your email address.' })
      return
    }

    setSubmitting(true)
    setStatus({ variant: 'info', message: 'Please wait…' })

    try {
      const auth = getFirebaseAuth()
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, trimmedEmail)
        setStatus({ variant: 'success', message: 'Password reset email sent. Check your inbox.' })
        return
      }

      if (!password) {
        setStatus({ variant: 'error', message: 'Enter your password.' })
        return
      }

      await signInWithEmailAndPassword(auth, trimmedEmail, password)
      setStatus({ variant: 'success', message: 'Signed in. Redirecting…' })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign-in failed.'
      setStatus({ variant: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <i className="fas fa-building" />
            </div>
            <div>
              <div className="text-sm font-semibold">Society Management System</div>
              <div className="text-xs text-gray-500">Resident Portal</div>
            </div>
          </div>
          <Link className="text-sm text-gray-600 hover:text-gray-900" to="/resident">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-8 px-4 py-10 lg:grid-cols-2">
        <section className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Secure Access</div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sign in to manage your society tasks</h1>
          <p className="mt-3 text-sm text-gray-600">
            Payments, notices, complaints and service bookings — all in one place with role-based access.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary">
                  <i className="fas fa-shield-check" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Role protected</div>
                  <div className="text-sm text-gray-600">Residents see resident tools; admins see admin tools.</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary">
                  <i className="fas fa-envelope-open-text" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Password reset</div>
                  <div className="text-sm text-gray-600">Recover access instantly using your email.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{mode === 'reset' ? 'Reset password' : 'Sign in'}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {mode === 'reset'
                  ? 'We will email you a password reset link.'
                  : 'Use your society email and password.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatus(null)
                setMode((m) => (m === 'signin' ? 'reset' : 'signin'))
              }}
              className="rounded-full border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              {error}
            </div>
          ) : null}

          {status ? (
            <div
              className={
                'mt-6 rounded-2xl border p-4 text-sm ' +
                (status.variant === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : status.variant === 'error'
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-blue-200 bg-blue-50 text-blue-900')
              }
              role="status"
              aria-live="polite"
            >
              {status.message}
            </div>
          ) : null}

          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-2xl border px-4 text-sm outline-none ring-primary/30 focus:ring-4"
                autoComplete="email"
                inputMode="email"
              />
            </label>

            {mode === 'signin' ? (
              <label className="grid gap-2">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 rounded-2xl border px-4 text-sm outline-none ring-primary/30 focus:ring-4"
                  autoComplete="current-password"
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={submitting || Boolean(error)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === 'reset' ? 'Send reset email' : 'Sign in'}
            </button>

            <div className="text-xs text-gray-500">
              For account creation, ask your admin to add you in the admin dashboard.
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

