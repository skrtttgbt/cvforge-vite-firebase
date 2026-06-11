import Card from "../../Card";
import FormField from "../../FormField";
import Button from "../../Button";

export default function PersonalInformationTab({ form, isEditing, onChange }) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card title="Personal Information">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Full Name"
            name="fullName"
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
            value={form.phone}
            onChange={onChange}
            disabled={!isEditing}
          />

          <FormField
            label="Location"
            name="location"
            value={form.location}
            onChange={onChange}
            disabled={!isEditing}
          />

          <FormField
            label="Target ICT Role"
            as="select"
            name="targetRole"
            value={form.targetRole}
            onChange={onChange}
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
