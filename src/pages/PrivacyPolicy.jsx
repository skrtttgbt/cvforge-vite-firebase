import { privacySections } from "../utils/privacyPolicy";
export default function PrivacyPolicy() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p>Updated October 7, 2026</p>
      {privacySections.map((section) => (
        <section key={section.heading} className="my-6">
          <h2 className="text-xl font-bold">{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <a
        href="https://privacy.gov.ph/data-privacy-act-/"
        target="_blank"
        rel="noreferrer"
      >
        Read Republic Act No. 10173
      </a>
      <p>
        <a href="/">Return Home</a>
      </p>
    </main>
  );
}
