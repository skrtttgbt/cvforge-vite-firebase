import { safeUrl } from "./grounding.js";

const sourceDomains = {
  LinkedIn: ["linkedin.com"],
  GitHub: ["github.com"],
  Facebook: ["facebook.com"],
  Indeed: ["indeed.com", "indeed.com.ph"],
  JobStreet: ["jobstreet.com", "jobstreet.com.ph"],
};

export function validateSourceUrl(sourceName, value) {
  const input = String(value || "").trim();
  if (!input) return { valid: false, url: "", error: "" };

  const normalizedUrl = safeUrl(input);
  if (!normalizedUrl) {
    return {
      valid: false,
      url: "",
      error: "Use a full http:// or https:// URL.",
    };
  }

  const allowedDomains = sourceDomains[sourceName];
  if (!allowedDomains) return { valid: true, url: normalizedUrl, error: "" };

  const hostname = new URL(normalizedUrl).hostname.toLowerCase();
  const matches = allowedDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

  if (!matches) {
    return {
      valid: false,
      url: "",
      error: `${sourceName} links must use ${allowedDomains[0]}.`,
    };
  }

  return { valid: true, url: normalizedUrl, error: "" };
}

export function sourceUrlError(source) {
  return validateSourceUrl(source?.name, source?.url).error;
}

export function isConnectedProfileSource(source) {
  return (
    ["Connected", "Imported"].includes(source?.status) &&
    validateSourceUrl(source?.name, source?.url).valid
  );
}
