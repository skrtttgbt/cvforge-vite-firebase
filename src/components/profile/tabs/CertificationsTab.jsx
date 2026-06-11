import Card from "../../Card";
import FormField from "../../FormField";
import Button from "../../Button";

const emptyCertification = {
  name: "",
  organization: "",
  issueDate: "",
  credentialId: "",
  credentialLink: "",
};

export default function CertificationsTab({
  form,
  isEditing,
  onAddCertification,
  onRemoveCertification,
  onCertificationChange,
}) {
  const certifications = form.certifications || [];

  return (
    <Card className="mt-5" title="Certifications">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Certifications</h3>
            <p className="text-sm text-slate-500">
              Add your professional or technical certifications.
            </p>
          </div>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddCertification(emptyCertification)}
            >
              + Add Certification
            </Button>
          )}
        </div>

        {certifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-500">No certifications added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-forge">
                    Certification #{index + 1}
                  </h4>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => onRemoveCertification(index)}
                      className="text-sm font-bold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Certification Name"
                    name="name"
                    value={cert.name || ""}
                    onChange={(e) =>
                      onCertificationChange(index, "name", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Issuing Organization"
                    name="organization"
                    value={cert.organization || ""}
                    onChange={(e) =>
                      onCertificationChange(index, "organization", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Issue Date"
                    type="month"
                    name="issueDate"
                    value={cert.issueDate || ""}
                    onChange={(e) =>
                      onCertificationChange(index, "issueDate", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Credential ID"
                    name="credentialId"
                    value={cert.credentialId || ""}
                    onChange={(e) =>
                      onCertificationChange(index, "credentialId", e.target.value)
                    }
                    disabled={!isEditing}
                  />

                  <FormField
                    label="Credential Link"
                    name="credentialLink"
                    value={cert.credentialLink || ""}
                    onChange={(e) =>
                      onCertificationChange(index, "credentialLink", e.target.value)
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