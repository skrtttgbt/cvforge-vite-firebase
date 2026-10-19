import test from "node:test";
import assert from "node:assert/strict";
import {
  isConnectedProfileSource,
  validateSourceUrl,
} from "../src/utils/sourceValidation.js";

test("platform sources accept their own domains and subdomains", () => {
  const cases = [
    ["Facebook", "https://facebook.com/applicant"],
    ["Facebook", "https://www.facebook.com/applicant"],
    ["LinkedIn", "https://ph.linkedin.com/in/applicant"],
    ["GitHub", "https://github.com/applicant"],
    ["Indeed", "https://ph.indeed.com/profile/applicant"],
    ["JobStreet", "https://www.jobstreet.com.ph/profile/applicant"],
  ];

  for (const [sourceName, url] of cases) {
    assert.equal(validateSourceUrl(sourceName, url).valid, true);
  }
});

test("platform sources reject lookalike and unrelated domains", () => {
  for (const url of [
    "https://example.com/applicant",
    "https://facebook.com.example.com/applicant",
    "https://fakefacebook.com/applicant",
  ]) {
    const result = validateSourceUrl("Facebook", url);
    assert.equal(result.valid, false);
    assert.match(result.error, /facebook\.com/i);
  }
});

test("generic website and document sources accept safe web URLs", () => {
  assert.equal(
    validateSourceUrl("Personal Website", "https://example.dev").valid,
    true,
  );
  assert.equal(
    validateSourceUrl("Resume / CV", "https://files.example.com/resume.pdf")
      .valid,
    true,
  );
  assert.equal(
    validateSourceUrl("Portfolio", "javascript:alert(1)").valid,
    false,
  );
});

test("only connected or imported valid sources are shareable", () => {
  const source = { name: "GitHub", url: "https://github.com/applicant" };
  assert.equal(isConnectedProfileSource({ ...source, status: "Connected" }), true);
  assert.equal(isConnectedProfileSource({ ...source, status: "Imported" }), true);
  assert.equal(isConnectedProfileSource({ ...source, status: "Pending" }), false);
  assert.equal(isConnectedProfileSource({ ...source, status: "Disconnected" }), false);
  assert.equal(
    isConnectedProfileSource({
      name: "GitHub",
      url: "https://facebook.com/applicant",
      status: "Connected",
    }),
    false,
  );
});
