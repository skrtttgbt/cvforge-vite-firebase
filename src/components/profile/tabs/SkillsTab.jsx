import Card from "../../Card";
import FormField from "../../FormField";
import Button from "../../Button";

const emptySkill = {
  skillName: "",
  category: "",
  proficiencyLevel: "",
};

export default function SkillsTab({
  form,
  isEditing,
  onAddSkill,
  onRemoveSkill,
  onSkillChange,
}) {
  const skills = form.skills || [];

  return (
    <Card className="mt-5" title="Skills">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Technical and Soft Skills</h3>
            <p className="text-sm text-slate-500">
              Add your programming, design, communication, or workplace skills.
            </p>
          </div>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddSkill(emptySkill)}
            >
              + Add Skill
            </Button>
          )}
        </div>

        {skills.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-500">No skills added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-forge">Skill #{index + 1}</h4>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => onRemoveSkill(index)}
                      className="text-sm font-bold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    label="Skill Name"
                    name="skillName"
                    value={skill.skillName || ""}
                    onChange={(e) =>
                      onSkillChange(index, "skillName", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Category"
                    as="select"
                    name="category"
                    value={skill.category || ""}
                    onChange={(e) =>
                      onSkillChange(index, "category", e.target.value)
                    }
                    disabled={!isEditing}
                  >
                    <option value="">Select Category</option>
                    <option value="Programming">Programming</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">
                      Mobile Development
                    </option>
                    <option value="Database">Database</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Data Analytics">Data Analytics</option>
                    <option value="Artificial Intelligence / Machine Learning">
                      Artificial Intelligence / Machine Learning
                    </option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Hardware / Networking">
                      Hardware / Networking
                    </option>
                    <option value="Soft Skill">Soft Skill</option>
                    <option value="Other">Other</option>
                  </FormField>

                  <FormField
                    label="Proficiency Level"
                    as="select"
                    name="proficiencyLevel"
                    value={skill.proficiencyLevel || ""}
                    onChange={(e) =>
                      onSkillChange(index, "proficiencyLevel", e.target.value)
                    }
                    disabled={!isEditing}
                  >
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
