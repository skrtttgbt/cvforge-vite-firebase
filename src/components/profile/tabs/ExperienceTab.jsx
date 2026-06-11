import Card from "../../Card";
import FormField from "../../FormField";
import Button from "../../Button";

const emptyExperience = {
  companyName: "",
  jobTitle: "",
  employmentType: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
};

export default function ExperienceTab({
  form,
  isEditing,
  onAddExperience,
  onRemoveExperience,
  onExperienceChange,
}) {
  const experiences = form.experience || [];

  return (
    <Card className="mt-5" title="Experience">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Work Experience</h3>
            <p className="text-sm text-slate-500">
              Add your internships, freelance work, part-time, or full-time jobs.
            </p>
          </div>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddExperience(emptyExperience)}
            >
              + Add Experience
            </Button>
          )}
        </div>

        {experiences.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-500">
              No experience added yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((experience, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-forge">
                    Experience #{index + 1}
                  </h4>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => onRemoveExperience(index)}
                      className="text-sm font-bold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Company / Organization"
                    name="companyName"
                    value={experience.companyName || ""}
                    onChange={(e) =>
                      onExperienceChange(index, "companyName", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Job Title / Role"
                    name="jobTitle"
                    value={experience.jobTitle || ""}
                    onChange={(e) =>
                      onExperienceChange(index, "jobTitle", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Employment Type"
                    as="select"
                    name="employmentType"
                    value={experience.employmentType || ""}
                    onChange={(e) =>
                      onExperienceChange(index, "employmentType", e.target.value)
                    }
                    disabled={!isEditing}
                  >
                    <option value="">Select Type</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Project-based">Project-based</option>
                  </FormField>

                  <FormField
                    label="Location"
                    name="location"
                    value={experience.location || ""}
                    onChange={(e) =>
                      onExperienceChange(index, "location", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Start Date"
                    type="month"
                    name="startDate"
                    value={experience.startDate || ""}
                    onChange={(e) =>
                      onExperienceChange(index, "startDate", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="End Date"
                    type="month"
                    name="endDate"
                    value={experience.endDate || ""}
                    onChange={(e) =>
                      onExperienceChange(index, "endDate", e.target.value)
                    }
                    disabled={!isEditing || experience.isCurrent}
                  />
                </div>

                <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={experience.isCurrent || false}
                    onChange={(e) =>
                      onExperienceChange(index, "isCurrent", e.target.checked)
                    }
                    disabled={!isEditing}
                  />
                  I currently work here
                </label>

                <div className="mt-4">
                  <FormField
                    label="Responsibilities / Description"
                    as="textarea"
                    name="description"
                    value={experience.description || ""}
                    onChange={(e) =>
                      onExperienceChange(index, "description", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}