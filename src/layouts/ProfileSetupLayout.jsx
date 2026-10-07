import { useEffect, useRef } from 'react';
import { logoutUser } from '../services/authservice';

export default function ProfileSetupLayout({ children }) {
  const modal = useRef(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  function trapFocus(event) {
    if (event.key === 'Escape') { event.preventDefault(); if (window.confirm('Sign out and close profile setup? Unsaved changes will be lost.')) logoutUser(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...modal.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')]
      .filter(element => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal.current)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === modal.current)) {
      event.preventDefault(); first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-6">
      <main id="main-content" ref={modal} role="dialog" aria-modal="true" aria-labelledby="profile-setup-title" aria-describedby="profile-setup-description" tabIndex={-1} onKeyDown={trapFocus}
        className="max-h-[95dvh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-slate-50 p-4 shadow-2xl outline-none sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 id="profile-setup-title" className="text-2xl font-extrabold text-ink">Set up your profile</h1>
            <p id="profile-setup-description" className="mt-2 text-sm text-slate-600">Complete your personal information, education, experience, skills, projects, and certifications to unlock CVForge. Your progress can be saved along the way.</p>
          </div>
          <button type="button" className="shrink-0 text-sm font-bold text-forge" onClick={() => { if (window.confirm('Sign out? Unsaved changes will be lost.')) logoutUser().catch(() => window.alert('Unable to sign out. Please try again.')); }}>Sign out</button>
        </div>
        {children}
      </main>
    </div>
  );
}
