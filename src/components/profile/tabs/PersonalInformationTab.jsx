import Card from "../../Card";
import FormField from "../../FormField";
import Button from "../../Button";
import { useState } from "react";
import { mobileError, normalizePhilippineMobile } from "../../../utils/profileValidation";

export default function PersonalInformationTab({ form, isEditing, onChange }) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card title="Personal Information">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Full Name"
            name="fullName"
            required
            value={form.fullName}
            onChange={onChange}
            disabled={!isEditing}
          />

          <FormField
            label="Email Address"
            name="email"
            value={form.email}
            onChange={onChange}
            disabled
          />

          <FormField
            label="Phone Number"
            name="phone"
            required
            onBlur={() => setPhoneTouched(true)}
            error={isEditing && phoneTouched && !normalizePhilippineMobile(form.phone) ? mobileError : undefined}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09123456789 or +639123456789"
            value={form.phone}
            onChange={onChange}
            disabled={!isEditing}
          />

          <FormField
            label="Location"
            name="location"
            required
            value={form.location}
            onChange={onChange}
            disabled={!isEditing}
          />

</div>

        <div className="mt-4">
          <FormField
            label="Professional Summary"
            as="textarea"
            name="summary"
            value={form.summary}
            onChange={onChange}
            disabled={!isEditing}
          />
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
  );
}
