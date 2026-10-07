import { Link } from "react-router-dom";
import Logo from "../components/Logo";
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-navy p-6 text-white">
        <Logo dark />
        <Link to="/login">Sign in</Link>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-16"
      >
        <h1 className="text-4xl font-extrabold text-ink">
          Build your next ICT career application
        </h1>
        <p className="my-6 text-lg text-slate-600">
          Create and review your resume and portfolio, then share approved
          content through a secure link. Practice interviews with text feedback.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            className="rounded-lg bg-forge px-5 py-3 font-bold text-white"
            to="/register"
          >
            Create a job seeker account
          </Link>
          <Link
            className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
            to="/access-token"
          >
            Access a shared portfolio
          </Link>
        </div>
        <p className="mt-8 text-slate-600">
          Employers and HR use an access token provided by the job seeker. No
          employer account is needed.
        </p>
        <Link className="mt-8 inline-block text-forge" to="/privacy">
          Privacy Policy
        </Link>
      </main>
    </div>
  );
}
