import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import FormField from '../components/FormField'
import Button from '../components/Button'
import { registerWithEmail, loginWithGoogle, loginWithMicrosoft } from '../services/authservice'
import { saveProfile, getProfile } from '../services/firestoreService.js'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null) // 'google' | 'microsoft'
  const [errors, setErrors] = useState({})

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required.'
    if (!form.email.trim()) errs.email = 'Email address is required.'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    if (!agreed) errs.agreed = 'You must agree to the Terms of Service.'
    return errs
  }

  async function handleRegister(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({})
    setLoading(true)
    try {
      const user = await registerWithEmail(form.email, form.password)
      await saveProfile(user.uid, { displayName: form.name, email: form.email })
      navigate('/dashboard')
    } catch (err) {
      setErrors({ global: getFriendlyError(err.code) })
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider) {
    setErrors({})
    setOauthLoading(provider)
    try {
      const user = provider === 'google' ? await loginWithGoogle() : await loginWithMicrosoft()
      const existing = await getProfile(user.uid)
      if (existing?.profileComplete) {
        navigate('/dashboard')
      } else {
        navigate('/complete-profile', { state: { user: { uid: user.uid, displayName: user.displayName, email: user.email } } })
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setErrors({ global: getFriendlyError(err.code) })
      }
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <AuthLayout type="register">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-ink">Create Your Account</h1>
        <p className="mt-2 text-slate-500">Sign up to get started with CVForge</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleRegister}>
        <FormField
          label="Full Name"
          placeholder="Enter your full name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          required
        />
        <FormField
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <FormField
          label="Password"
          type="password"
          placeholder="Create a password (min. 8 characters)"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
        />
        <FormField
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />

        <div>
          <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 shrink-0"
            />

            <span className="leading-relaxed">
              I agree to the{" "}
              <Link to="/terms" className="font-medium text-forge">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="font-medium text-forge">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreed && <p className="mt-1 text-xs text-red-500">{errors.agreed}</p>}
        </div>

        {errors.global && (
          <p className="text-sm text-red-500 text-center">{errors.global}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
        <hr className="flex-1" />
        or sign up with
        <hr className="flex-1" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          type="button"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('google')}
        >
          {oauthLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('microsoft')}
        >
          {oauthLoading === 'microsoft' ? 'Redirecting…' : 'Continue with Microsoft'}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-forge font-medium">Log in</Link>
      </p>
    </AuthLayout>
  )
}

function getFriendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return `That email address doesn't look right.`
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.'
    default:
      return 'Something went wrong. Please try again.'
  }
}