import Card from "../../Card";
import FormField from "../../FormField";
import Button from "../../Button";

const emptyProject = {
  projectTitle: "",
  projectType: "",
  role: "",
  technologiesUsed: "",
  projectLink: "",
  repositoryLink: "",
  startDate: "",
  endDate: "",
  isOngoing: false,
  description: "",
};

export default function ProjectsTab({
  form,
  isEditing,
  onAddProject,
  onRemoveProject,
  onProjectChange,
}) {
  const projects = form.projects || [];

  return (
    <Card className="mt-5" title="Projects">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Projects</h3>
            <p className="text-sm text-slate-500">
              Add academic, personal, capstone, freelance, or professional
              projects.
            </p>
          </div>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddProject(emptyProject)}
            >
              + Add Project
            </Button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-500">No projects added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-forge">
                    Project #{index + 1}
                  </h4>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => onRemoveProject(index)}
                      className="text-sm font-bold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Project Title"
                    name="projectTitle"
                    value={project.projectTitle || ""}
                    onChange={(e) =>
                      onProjectChange(index, "projectTitle", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Project Type"
                    as="select"
                    name="projectType"
                    value={project.projectType || ""}
                    onChange={(e) =>
                      onProjectChange(index, "projectType", e.target.value)
                    }
                    disabled={!isEditing}
                  >
                    <option value="">Select Project Type</option>
                    <option value="Academic Project">Academic Project</option>
                    <option value="Capstone Project">Capstone Project</option>
                    <option value="Personal Project">Personal Project</option>
                    <option value="Freelance Project">Freelance Project</option>
                    <option value="Professional Project">
                      Professional Project
                    </option>
                    <option value="Open Source Project">
                      Open Source Project
                    </option>
                    <option value="Other">Other</option>
                  </FormField>

                  <FormField
                    label="Role / Position"
                    name="role"
                    value={project.role || ""}
                    onChange={(e) =>
                      onProjectChange(index, "role", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Technologies Used"
                    name="technologiesUsed"
                    value={project.technologiesUsed || ""}
                    onChange={(e) =>
                      onProjectChange(index, "technologiesUsed", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Project / Live Demo Link"
                    name="projectLink"
                    value={project.projectLink || ""}
                    onChange={(e) =>
                      onProjectChange(index, "projectLink", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Repository Link"
                    name="repositoryLink"
                    value={project.repositoryLink || ""}
                    onChange={(e) =>
                      onProjectChange(index, "repositoryLink", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Start Date"
                    type="month"
                    name="startDate"
                    value={project.startDate || ""}
                    onChange={(e) =>
                      onProjectChange(index, "startDate", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="End Date"
                    type="month"
                    name="endDate"
                    value={project.endDate || ""}
                    onChange={(e) =>
                      onProjectChange(index, "endDate", e.target.value)
                    }
                    disabled={!isEditing || project.isOngoing}
                  />
                </div>

                <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={project.isOngoing || false}
                    onChange={(e) =>
                      onProjectChange(index, "isOngoing", e.target.checked)
                    }
                    disabled={!isEditing}
                  />
                  This project is ongoing
                </label>

                <div className="mt-4">
                  <FormField
                    label="Project Description"
                    as="textarea"
                    name="description"
                    value={project.description || ""}
                    onChange={(e) =>
                      onProjectChange(index, "description", e.target.value)
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