import Button from "../Button";

export default function ProfileActionBar({
  activeTab,
  isEditing,
  hasChanges,
  onEdit,
  onCancel,
  onSave,
}) {
  return (
    <div className="sticky top-20 z-10 m-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-bold text-ink">{activeTab}</h3>

        <p className="text-sm text-slate-500">
          {isEditing ? "Editing mode enabled" : "Viewing profile information"}
        </p>
      </div>

      <div className="flex gap-3">
        {!isEditing ? (
          <Button onClick={onEdit}>Edit Profile</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            <Button onClick={onSave} disabled={!hasChanges}>
              {hasChanges ? "Save Changes" : "No Changes"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
