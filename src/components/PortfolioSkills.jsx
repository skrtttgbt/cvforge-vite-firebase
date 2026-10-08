const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function PortfolioSkills({ skills = [], minimal = false }) {
  const rows = skills
    .flatMap((skill) => {
      if (typeof skill === "string")
        return [{ name: skill, level: "", category: "" }];
      if (Array.isArray(skill?.items))
        return skill.items.map((item) => ({
          name: item.name || item.skillName || "",
          level: item.level || item.proficiencyLevel || "",
          category: skill.category || "",
        }));
      return [
        {
          name: skill?.name || skill?.skillName || "",
          level: skill?.level || skill?.proficiencyLevel || "",
          category: skill?.category || "",
        },
      ];
    })
    .filter((skill) => skill.name.trim());

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Proficiency levels provided by the candidate.
      </p>
      {rows.map((skill, index) => {
        const rank =
          levels.findIndex(
            (level) =>
              level.toLowerCase() === String(skill.level).trim().toLowerCase(),
          ) + 1;
        return (
          <div key={`${skill.name}-${index}`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{skill.name}</p>
                {skill.category && (
                  <p className="text-xs text-slate-500">{skill.category}</p>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${minimal ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-forge"}`}
              >
                {rank
                  ? levels[rank - 1]
                  : skill.level || "Proficiency not specified"}
              </span>
            </div>
            {rank > 0 && (
              <div
                role="meter"
                aria-label={`${skill.name} proficiency`}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={rank}
                aria-valuetext={levels[rank - 1]}
                className="grid grid-cols-4 gap-1.5"
              >
                {levels.map((level, segment) => (
                  <span
                    key={level}
                    aria-hidden="true"
                    className={`h-2 rounded-full ${segment < rank ? (minimal ? "bg-slate-700" : "bg-forge") : "bg-slate-200"}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {/* <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {levels.map((level, index) => (
          <span key={level}>
            {index + 1} · {level}
          </span>
        ))}
      </div> */}
    </div>
  );
}
