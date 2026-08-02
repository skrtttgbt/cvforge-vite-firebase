import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import FormField from '../components/FormField'
import Button from '../components/Button'
import { saveProfile } from '../services/firestoreService'

const ICT_ROLES = [
  'Software Developer',
  'Web Developer',
  'Mobile Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'AI Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cybersecurity Analyst',
  'Network Engineer',
  'Systems Administrator',
  'Database Administrator',
  'IT Support Specialist',
  'Project Manager',
  'Business Analyst',
  'QA Engineer',
  'Embedded Systems Engineer',
  'Game Developer',
  'Blockchain Developer',
]

export default function CompleteProfile() {
  const navigate = useNavigate()
  const location = useLocation()

  // user passed via navigation state from Register.jsx OAuth flow
  const user = location.state?.user

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    location: '',
    targetRole: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.'
    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    else if (!/^\+?[\d\s\-().]{7,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.'
    if (!form.location.trim()) errs.location = 'Location is required.'
    if (!form.targetRole) errs.targetRole = 'Please select your target ICT role.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({})
    setLoading(true)
    try {
      await saveProfile(user.uid, {
        fullName: form.fullName,
        email: user.email,
        phone: form.phone,
        location: form.location,
        targetRole: form.targetRole,
        profileComplete: true,
      })
      navigate('/dashboard')
    } catch (err) {
      setErrors({ global: 'Failed to save your profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Guard: if no user was passed, redirect to register
  if (!user) {
    navigate('/register')
    return null
  }

  return (
    <AuthLayout type="register">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-ink">Complete Your Profile</h1>
        <p className="mt-2 text-slate-500">
          Just a few more details to set up your CVForge account
        </p>
      </div>

      {/* Step indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forge text-white text-xs font-bold">✓</span>
          <span className="text-slate-400">Sign in</span>
        </div>
        <div className="h-px w-8 bg-slate-200" />
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forge text-white text-xs font-bold">2</span>
          <span>Your details</span>
        </div>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <FormField
          label="Full Name"
          placeholder="Enter your full name"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          required
        />
        <FormField
          label="Phone Number"
          type="tel"
          placeholder="+63 912 345 6789"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          required
        />
        <FormField
          label="Location"
          placeholder="e.g. Manila, Philippines"
          value={form.location}
          onChange={set('location')}
          error={errors.location}
          required
        />

        {/* Target ICT Role — dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target ICT Role <span className="text-red-500">*</span>
          </label>
          <select
            value={form.targetRole}
            onChange={set('targetRole')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-forge focus:outline-none focus:ring-1 focus:ring-forge bg-white"
          >
            <option value="" disabled>Select your target role</option>
            {ICT_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {errors.targetRole && (
            <p className="mt-1 text-xs text-red-500">{errors.targetRole}</p>
          )}
        </div>

        {errors.global && (
          <p className="text-sm text-red-500 text-center">{errors.global}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Finish Setup'}
        </Button>
      </form>
    </AuthLayout>
  )
}