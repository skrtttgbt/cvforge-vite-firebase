import Card from "../../Card";
import FormField from "../../FormField";
import Button from "../../Button";

const singleEducationGroups = [
  {
    key: "primary",
    title: "Primary Education",
    fields: [
      { label: "School Name", name: "schoolName" },
      { label: "Year Graduated", name: "yearGraduated" },
    ],
  },
  {
    key: "secondary",
    title: "Secondary Education",
    fields: [
      { label: "School Name", name: "schoolName" },
      { label: "Year Graduated", name: "yearGraduated" },
    ],
  },
];

const multipleEducationGroups = [
  {
    key: "college",
    title: "Tertiary Education",
    addLabel: "Add College",
    emptyItem: {
      schoolName: "",
      degreeProgram: "",
      yearGraduated: "",
    },
    fields: [
      { label: "College / University", name: "schoolName" },
      { label: "Degree Program", name: "degreeProgram" },
      { label: "Year Graduated", name: "yearGraduated" },
    ],
  },
  {
    key: "vocational",
    title: "Vocational / Technical Education",
    addLabel: "Add Vocational / Technical Education",
    emptyItem: {
      institution: "",
      course: "",
      completionYear: "",
    },
    fields: [
      { label: "Institution", name: "institution" },
      { label: "Course / NC Level", name: "course" },
      { label: "Completion Year", name: "completionYear" },
    ],
  },
  {
    key: "masters",
    title: "Masteral / Master's Degree",
    addLabel: "Add Masteral Degree",
    emptyItem: {
      university: "",
      degree: "",
      yearGraduated: "",
    },
    fields: [
      { label: "University", name: "university" },
      { label: "Degree", name: "degree" },
      { label: "Year Graduated", name: "yearGraduated" },
    ],
  },
  {
    key: "doctoral",
    title: "Doctoral Degree",
    addLabel: "Add Doctoral Degree",
    emptyItem: {
      university: "",
      degree: "",
      yearGraduated: "",
    },
    fields: [
      { label: "University", name: "university" },
      { label: "Degree", name: "degree" },
      { label: "Year Graduated", name: "yearGraduated" },
    ],
  },
];

export default function EducationTab({
  form,
  isEditing,
  onSingleEducationChange,
  onMultipleEducationChange,
  onAddEducation,
  onRemoveEducation,
}) {
  const education = form.education || {};

  return (
    <Card className="mt-5" title="Education">
      <div className="space-y-6">
        {singleEducationGroups.map((group) => (
          <div
            key={group.key}
            className="rounded-lg border border-slate-200 p-4"
          >
            <h3 className="mb-3 font-bold text-forge">{group.title}</h3>

            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <FormField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={education[group.key]?.[field.name] || ""}
                  onChange={(e) =>
                    onSingleEducationChange(
                      group.key,
                      field.name,
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                />
              ))}
            </div>
          </div>
        ))}

        {multipleEducationGroups.map((group) => {
          const items = education[group.key] || [];

          return (
            <div
              key={group.key}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-bold text-forge">{group.title}</h3>

                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onAddEducation(group.key, group.emptyItem)}
                  >
                    + {group.addLabel}
                  </Button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No {group.title.toLowerCase()} added yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={`${group.key}-${index}`}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-semibold text-ink">
                          {group.title} #{index + 1}
                        </h4>

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => onRemoveEducation(group.key, index)}
                            className="text-sm font-bold text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {group.fields.map((field) => (
                          <FormField
                            key={field.name}
                            label={field.label}
                            name={field.name}
                            value={item[field.name] || ""}
                            onChange={(e) =>
                              onMultipleEducationChange(
                                group.key,
                                index,
                                field.name,
                                e.target.value
                              )
                            }
                            disabled={!isEditing}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}