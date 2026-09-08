import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhilippineMobile,
  getIncompleteSections,
  isProfileComplete,
  validateProfile,
} from "./profileValidation.js";

const complete = () => ({
  fullName: "Juan Dela Cruz",
  email: "juan@example.com",
  phone: "09123456789",
  location: "Manila",
  education: {
    college: [
      {
        schoolName: "University",
        degreeProgram: "BSIT",
        yearGraduated: "2024",
      },
    ],
  },
  experience: [
    {
      companyName: "Company",
      jobTitle: "Intern",
      startDate: "2024-01",
      endDate: "2024-06",
    },
  ],
  skills: [
    {
      skillName: "JavaScript",
      category: "Programming",
      proficiencyLevel: "Intermediate",
    },
  ],
  projects: [
    {
      projectTitle: "Portfolio",
      role: "Developer",
      startDate: "2024-01",
      isOngoing: true,
    },
  ],
  certifications: [
    { name: "Certificate", organization: "Organization", issueDate: "2024-05" },
  ],
});

test("Philippine mobile formats normalize consistently", () => {
  for (const phone of [
    "09123456789",
    "+639123456789",
    "+63 912 345 6789",
    "0912-345-6789",
    " (0912) 345 6789 ",
  ]) {
    assert.equal(normalizePhilippineMobile(phone), "+639123456789");
  }
  for (const phone of [
    "",
    "0912345678",
    "091234567890",
    "+14155552671",
    "0281234567",
    "0912abc3456789",
    "+6309123456789",
    "++639123456789",
  ]) {
    assert.equal(normalizePhilippineMobile(phone), "");
  }
});

test("completion ignores stale flags and does not require target role", () => {
  assert.equal(isProfileComplete(complete()), true);
  assert.equal(
    isProfileComplete({ profileComplete: true, targetRole: "Developer" }),
    false,
  );
  assert.equal(getIncompleteSections(null).length, 6);
  for (const [key, tab] of [
    ["education", "Education"],
    ["experience", "Experience"],
    ["skills", "Skills"],
    ["projects", "Projects"],
    ["certifications", "Certifications"],
  ]) {
    const profile = complete();
    delete profile[key];
    assert.deepEqual(getIncompleteSections(profile), [tab]);
  }
});

test("blank entries and invalid partial education are incomplete", () => {
  const profile = complete();
  profile.skills = [{}];
  profile.education.primary = {
    schoolName: "School",
    yearGraduated: "yesterday",
  };
  assert.deepEqual(getIncompleteSections(profile), ["Education", "Skills"]);
});

test("valid partial profiles can save progress without being complete", () => {
  const profile = complete();
  profile.experience = [];
  profile.certifications = [];
  assert.deepEqual(validateProfile(profile), []);
  assert.equal(isProfileComplete(profile), false);
});

test("reject reversed dates, invalid months, and unsafe links", () => {
  const profile = complete();
  profile.experience[0].endDate = "2023-01";
  profile.certifications[0].issueDate = "2024-13";
  profile.projects[0].projectLink = "javascript:alert(1)";
  assert.deepEqual(getIncompleteSections(profile), [
    "Experience",
    "Projects",
    "Certifications",
  ]);
  assert.equal(validateProfile(profile).length, 3);
});
