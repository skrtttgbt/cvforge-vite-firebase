import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import Swal from "sweetalert2";
import PersonalInformationTab from "../components/profile/tabs/PersonalInformationTab";
import EducationTab from "../components/profile/tabs/EducationTab";
import ExperienceTab from "../components/profile/tabs/ExperienceTab";
import SkillsTab from "../components/profile/tabs/SkillsTab";
import ProjectsTab from "../components/profile/tabs/ProjectsTab";
import CertificationsTab from "../components/profile/tabs/CertificationsTab";

import { onAuthChange } from "../services/authservice";
import { getProfile, saveProfile } from "../services/firestoreService";

const tabs = [
  "Personal Information",
  "Education",
  "Experience",
  "Skills",
  "Projects",
  "Certifications",
];

const defaultEducation = {
  primary: {
    schoolName: "",
    yearGraduated: "",
  },
  secondary: {
    schoolName: "",
    yearGraduated: "",
  },
  college: [],
  vocational: [],
  masters: [],
  doctoral: [],
};

const defaultForm = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  targetRole: "",
  summary: "",

  education: defaultEducation,
  experience: [],
  skills: [],
  projects: [],
  certifications: [],
};

export default function ProfileManagement() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState("Personal Information");
  const [form, setForm] = useState(defaultForm);

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

            education: {
              ...defaultEducation,
              ...(profile.education || {}),
              primary: {
                ...defaultEducation.primary,
                ...(profile.education?.primary || {}),
              },
              secondary: {
                ...defaultEducation.secondary,
                ...(profile.education?.secondary || {}),
              },
              college: profile.education?.college || [],
              vocational: profile.education?.vocational || [],
              masters: profile.education?.masters || [],
              doctoral: profile.education?.doctoral || [],
            },

            experience: profile.experience || [],
            skills: profile.skills || [],
            projects: profile.projects || [],
            certifications: profile.certifications || [],
          };

          setForm(profileData);
          setOriginalForm(profileData);
        } else {
          const newUserForm = {
            ...defaultForm,
            email: user.email || "",
          };

          setForm(newUserForm);
          setOriginalForm(newUserForm);
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    const result = await Swal.fire({
      title: "Save Changes?",
      text: "Do you want to save the changes to your profile?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await saveProfile(userId, form);

      setOriginalForm(form);
      setIsEditing(false);

      Swal.fire({
        icon: "success",
        title: "Profile Saved",
        text: "Your profile has been updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: "Unable to save your profile.",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Edit mode enabled",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Discard Changes?",
      text: "All unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Discard",
      cancelButtonText: "Keep Editing",
    });

    if (!result.isConfirmed) return;

    setForm(originalForm);
    setIsEditing(false);

    Swal.fire({
      icon: "success",
      title: "Changes Discarded",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // EDUCATION HANDLERS

  const handleSingleEducationChange = (groupKey, fieldName, value) => {
    setForm((prev) => ({
      ...prev,
      education: {
        ...prev.education,
        [groupKey]: {
          ...prev.education[groupKey],
          [fieldName]: value,
        },
      },
    }));
  };

  const handleMultipleEducationChange = (groupKey, index, fieldName, value) => {
    setForm((prev) => {
      const updatedList = [...(prev.education[groupKey] || [])];

      updatedList[index] = {
        ...updatedList[index],
        [fieldName]: value,
      };

      return {
        ...prev,
        education: {
          ...prev.education,
          [groupKey]: updatedList,
        },
      };
    });
  };

  const handleAddEducation = (groupKey, emptyItem) => {
    setForm((prev) => ({
      ...prev,
      education: {
        ...prev.education,
        [groupKey]: [
          ...(prev.education[groupKey] || []),
          { ...emptyItem },
        ],
      },
    }));

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Education added",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleRemoveEducation = async (groupKey, index) => {
    const result = await Swal.fire({
      title: "Remove Entry?",
      text: "This education record will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
    });

    if (!result.isConfirmed) return;

    setForm((prev) => ({
      ...prev,
      education: {
        ...prev.education,
        [groupKey]: prev.education[groupKey].filter((_, i) => i !== index),
      },
    }));

    Swal.fire({
      icon: "success",
      title: "Removed",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // EXPERIENCE HANDLERS

  const handleAddExperience = (emptyExperience) => {
    setForm((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        { ...emptyExperience },
      ],
    }));
  };

  const handleRemoveExperience = async (index) => {
    const result = await Swal.fire({
      title: "Delete Experience?",
      text: "This work experience will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));

    Swal.fire({
      icon: "success",
      title: "Experience Removed",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleExperienceChange = (index, fieldName, value) => {
    setForm((prev) => {
      const updatedExperience = [...(prev.experience || [])];

      updatedExperience[index] = {
        ...updatedExperience[index],
        [fieldName]: value,
      };

      if (fieldName === "isCurrent" && value === true) {
        updatedExperience[index].endDate = "";
      }

      return {
        ...prev,
        experience: updatedExperience,
      };
    });
  };

  // SKILLS HANDLERS

  const handleAddSkill = (emptySkill) => {
    setForm((prev) => ({
      ...prev,
      skills: [
        ...(prev.skills || []),
        { ...emptySkill },
      ],
    }));
  };

  const handleRemoveSkill = async (index) => {
    const result = await Swal.fire({
      title: "Remove Skill?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
    });

    if (!result.isConfirmed) return;

    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));

    Swal.fire({
      icon: "success",
      title: "Skill Removed",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleSkillChange = (index, fieldName, value) => {
    setForm((prev) => {
      const updatedSkills = [...(prev.skills || [])];

      updatedSkills[index] = {
        ...updatedSkills[index],
        [fieldName]: value,
      };

      return {
        ...prev,
        skills: updatedSkills,
      };
    });
  };

  // PROJECTS HANDLERS

  const handleAddProject = (emptyProject) => {
    setForm((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { ...emptyProject },
      ],
    }));
  };

  const handleRemoveProject = async (index) => {
    const result = await Swal.fire({
      title: "Delete Project?",
      text: "This project will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));

    Swal.fire({
      icon: "success",
      title: "Project Removed",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleProjectChange = (index, fieldName, value) => {
    setForm((prev) => {
      const updatedProjects = [...(prev.projects || [])];

      updatedProjects[index] = {
        ...updatedProjects[index],
        [fieldName]: value,
      };

      if (fieldName === "isOngoing" && value === true) {
        updatedProjects[index].endDate = "";
      }

      return {
        ...prev,
        projects: updatedProjects,
      };
    });
  };

  // CERTIFICATIONS HANDLERS

  const handleAddCertification = (emptyCertification) => {
    setForm((prev) => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        { ...emptyCertification },
      ],
    }));
  };

  const handleRemoveCertification = async (index) => {
    const result = await Swal.fire({
      title: "Delete Certification?",
      text: "This certification will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));

    Swal.fire({
      icon: "success",
      title: "Certification Removed",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleCertificationChange = (index, fieldName, value) => {
    setForm((prev) => {
      const updatedCertifications = [...(prev.certifications || [])];

      updatedCertifications[index] = {
        ...updatedCertifications[index],
        [fieldName]: value,
      };

      return {
        ...prev,
        certifications: updatedCertifications,
      };
    });
  };

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
      <div className="sticky top-20 z-10 m-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-ink">{activeTab}</h3>

          <p className="text-sm text-slate-500">
            {isEditing
              ? "Editing mode enabled"
              : "Viewing profile information"}
          </p>
        </div>

        <div className="flex gap-3">
          {!isEditing ? (
            <Button onClick={handleEdit}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                disabled={!hasChanges}
              >
                {hasChanges
                  ? "Save Changes"
                  : "No Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="flex min-w-max gap-2 px-4 py-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                activeTab === tab
                  ? "bg-blue-50 text-forge"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Personal Information" && (
        <PersonalInformationTab
          form={form}
          isEditing={isEditing}
          onChange={handleChange}
        />
      )}

      {activeTab === "Education" && (
        <EducationTab
          form={form}
          isEditing={isEditing}
          onSingleEducationChange={handleSingleEducationChange}
          onMultipleEducationChange={handleMultipleEducationChange}
          onAddEducation={handleAddEducation}
          onRemoveEducation={handleRemoveEducation}
        />
      )}

      {activeTab === "Experience" && (
        <ExperienceTab
          form={form}
          isEditing={isEditing}
          onAddExperience={handleAddExperience}
          onRemoveExperience={handleRemoveExperience}
          onExperienceChange={handleExperienceChange}
        />
      )}

      {activeTab === "Skills" && (
        <SkillsTab
          form={form}
          isEditing={isEditing}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
          onSkillChange={handleSkillChange}
        />
      )}

      {activeTab === "Projects" && (
        <ProjectsTab
          form={form}
          isEditing={isEditing}
          onAddProject={handleAddProject}
          onRemoveProject={handleRemoveProject}
          onProjectChange={handleProjectChange}
        />
      )}

      {activeTab === "Certifications" && (
        <CertificationsTab
          form={form}
          isEditing={isEditing}
          onAddCertification={handleAddCertification}
          onRemoveCertification={handleRemoveCertification}
          onCertificationChange={handleCertificationChange}
        />
      )}
    </AppLayout>
  );
}