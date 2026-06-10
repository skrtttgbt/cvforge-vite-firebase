import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import FormField from "../components/FormField";
import Button from "../components/Button";

import { onAuthChange } from "../services/authService";
import { getProfile, saveProfile } from "../services/firestoreService";

const tabs = [
  "Personal Information",
  "Education",
  "Experience",
  "Skills",
  "Projects",
  "Certifications",
  "Links",
];
export default function ProfileManagement() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    targetRole: "",
    summary: "",
  });
  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const profile = await getProfile(user.uid);

        if (profile) {
          const profileData = {
            fullName: profile.fullName || "",
            email: profile.email || user.email || "",
            phone: profile.phone || "",
            location: profile.location || "",
            targetRole: profile.targetRole || "",
            summary: profile.summary || "",
          };

          setForm(profileData);
          setOriginalForm(profileData);
        } else {
          setForm((prev) => ({
            ...prev,
            email: user.email || "",
          }));
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await saveProfile(userId, form);

      setOriginalForm(form);
      setIsEditing(false);

      alert("Profile saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save profile");
    }
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
  setForm(originalForm)
  setIsEditing(false)
}

  if (loading) {
    return (
      <AppLayout title="Profile Management">
        <p>Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Profile Management"
      subtitle="Manage and update your professional information"
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="flex min-w-max gap-2 px-4 py-3">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                index === 0
                  ? "bg-blue-50 text-forge"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Personal Information">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              disabled={!isEditing}
            />

            <FormField
              label="Email Address"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled
            />

            <FormField
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              disabled={!isEditing}
            />

            <FormField
              label="Location"
              name="location"
              value={form.location}
              onChange={handleChange}
              disabled={!isEditing}
            />

            <FormField
              label="Target ICT Role"
              as="select"
              name="targetRole"
              value={form.targetRole}
              onChange={handleChange}
              disabled={!isEditing}
            >
              <option value="">Select Role</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Mobile Developer">Mobile Developer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Cybersecurity Specialist">
                Cybersecurity Specialist
              </option>
            </FormField>
          </div>

          <div className="mt-4">
            <FormField
              label="Professional Summary"
              as="textarea"
              name="summary"
              value={form.summary}
              onChange={handleChange}
            />
          </div>

          <div className="mt-5 flex gap-3">
            {!isEditing ? (
              <Button onClick={handleEdit}>Edit Profile</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>

                <Button onClick={handleSave} disabled={!hasChanges}>
                  {hasChanges ? "Save Changes" : "No Changes"}
                </Button>
              </>
            )}
          </div>
        </Card>

        <div className="grid gap-5">
          <Card title="Profile Photo">
            <div className="grid place-items-center gap-4">
              <div className="grid h-40 w-40 place-items-center rounded-full bg-blue-100 text-7xl">
                👨‍💻
              </div>

              <Button variant="outline">Change Photo</Button>

              <p className="text-sm text-slate-500">JPG, PNG Max. 2MB</p>
            </div>
          </Card>

          <Card title="Quick Tips">
            <ul className="space-y-4 text-sm text-slate-700">
              <li>Keep your profile updated.</li>
              <li>Add complete information for better AI-generated results.</li>
              <li>Upload a clear professional profile photo.</li>
            </ul>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
