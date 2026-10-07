import { roleTopics } from "../utils/interviewRoles";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import { onAuthChange } from "../services/authservice";
import {
  getProfile,
  saveInterviewSession,
  getInterviewSessions,
} from "../services/firestoreService";
import { generateInterviewAI } from "../services/aiService";
import {
  WandSparkles,
  Save,
  Play,
  History,
  X,
  Eye,
  RotateCcw,
} from "lucide-react";

const unusedFocusAreaOptions = [
  "JavaScript",
  "React",
  "APIs",
  "Database",
  "Problem Solving",
  "Communication",
];

const defaultConfig = {
  targetRole: "",
  interviewType: "Technical + HR",
  experienceLevel: "Mid-Level",
  difficulty: "Intermediate",
  focusAreas: [],
};

export default function InterviewPreparation() {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);

  const [config, setConfig] = useState(defaultConfig);
  const focusAreaOptions = roleTopics(profile?.targetRole || "").filter(
    Boolean,
  );
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [questionNotice, setQuestionNotice] = useState("");
  const [questionSource, setQuestionSource] = useState("ai");

  const [sessionHistory, setSessionHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  useEffect(() => {
    if (!showHistoryModal) return;
    const trigger = document.activeElement;
    document.querySelector("[role=dialog] button")?.focus();
    const key = (e) => {
      if (e.key === "Escape") setShowHistoryModal(false);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      trigger?.focus();
    };
  }, [showHistoryModal]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const savedProfile = await getProfile(user.uid);
        const savedSessions = await getInterviewSessions(user.uid);

        setProfile(savedProfile || null);
        setSessionHistory(savedSessions || []);

        if (savedProfile?.targetRole) {
          setConfig((prev) => ({
            ...prev,
            targetRole: savedProfile.targetRole,
          }));
        }
      } catch (error) {
        console.error("Error loading interview profile:", error);
        setError("Failed to load profile data.");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    if (name === "targetRole") return;

    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFocusToggle = (focusArea) => {
    setConfig((prev) => {
      const isSelected = prev.focusAreas.includes(focusArea);

      return {
        ...prev,
        focusAreas: isSelected
          ? prev.focusAreas.filter((item) => item !== focusArea)
          : [...prev.focusAreas, focusArea],
      };
    });
  };

  const handleAnswerChange = (index, value) => {
    setQuestions((prev) => {
      const updatedQuestions = [...prev];

      updatedQuestions[index] = {
        ...updatedQuestions[index],
        answer: value,
      };

      return updatedQuestions;
    });
  };

  const startMockInterview = async () => {
    setStarting(true);
    setError("");
    setFeedback(null);

    try {
      const result = await generateInterviewAI("Interview Questions", {
        ...config,
        targetRole: profile?.targetRole || "",
        profile: buildProfilePayload(profile),
      });

      const generatedQuestions = (result.questions || []).map((item) => ({
        question: item.question || "",
        category: item.category || "General",
        answer: "",
        feedback: null,
      }));

      setQuestions(generatedQuestions);
      setQuestionNotice(result.notice || "");
      setQuestionSource(result.source || "ai");
      setActiveIndex(0);
      setFeedback(null);
    } catch (error) {
      console.error("Question generation error:", error);
      setError(error.message || "Failed to generate interview questions.");
    }

    setStarting(false);
  };

  const analyzeCurrentResponse = async () => {
    const currentQuestion = questions[activeIndex];

    if (!currentQuestion) {
      alert("Start a mock interview first.");
      return;
    }

    if (!currentQuestion.answer?.trim()) {
      alert("Please type your answer first.");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const result = await generateInterviewAI("Interview Feedback", {
        ...config,
        question: currentQuestion.question,
        answer: currentQuestion.answer,
        profile: buildProfilePayload(profile),
      });

      const currentFeedback = result.feedback || null;

      setQuestions((prev) => {
        const updatedQuestions = [...prev];

        updatedQuestions[activeIndex] = {
          ...updatedQuestions[activeIndex],
          feedback: currentFeedback,
        };

        return updatedQuestions;
      });

      setFeedback(currentFeedback);
    } catch (error) {
      console.error("Feedback generation error:", error);
      setError(error.message || "Failed to analyze response.");
    }

    setAnalyzing(false);
  };

  const saveSession = async () => {
    if (!userId) {
      alert("You must be logged in to save the interview session.");
      return;
    }

    if (!questions.length) {
      alert("Start a mock interview first.");
      return;
    }

    setSaving(true);

    try {
      await saveInterviewSession(userId, {
        config,
        questions,
        questionSource,
        questionNotice,
        latestFeedback: feedback,
      });

      const updatedSessions = await getInterviewSessions(userId);
      setSessionHistory(updatedSessions || []);

      alert("Interview session saved.");
    } catch (error) {
      console.error("Save interview session error:", error);
      alert("Failed to save interview session.");
    }

    setSaving(false);
  };

  const loadHistorySession = (session) => {
    const loadedQuestions = session.questions || [];

    setConfig({ ...defaultConfig, ...session.config, targetRole: profile?.targetRole || "", focusAreas: (session.config?.focusAreas || []).filter((topic) => focusAreaOptions.includes(topic)) });
    setQuestions(loadedQuestions);
    setQuestionSource(session.questionSource || "ai");
    setQuestionNotice(session.questionNotice || "");
    setActiveIndex(0);
    setFeedback(
      loadedQuestions?.[0]?.feedback || session.latestFeedback || null,
    );
    setShowHistoryModal(false);
    setSelectedHistory(null);
  };

  const currentQuestion = questions[activeIndex];

  if (loading) {
    return (
      <AppLayout title="Interview Preparation">
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Interview Preparation"
      subtitle="Practice ICT job interviews with AI-generated questions and feedback"
      badge="Powered by AI"
    >
      <p role="note">
        AI-generated practice feedback. This is not an official employer or HR
        assessment.
      </p>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr_0.9fr]">
        <Card
          title="Interview Session Setup"
          right={
            <Button variant="outline" aria-label="Interview History" onClick={() => setShowHistoryModal(true)}>
              <History size={20} />
            </Button>
          }
        >
          <div className="grid gap-4">
            <FormField
              label="Target ICT Role"
              as="select"
              name="targetRole"
              value={profile?.targetRole || ""}
              disabled
              onChange={handleConfigChange}
            >
              <option value={profile?.targetRole || ""}>
                {profile?.targetRole || "Set target role in Profile"}
              </option>
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

            <FormField
              label="Interview Type"
              as="select"
              name="interviewType"
              value={config.interviewType}
              onChange={handleConfigChange}
            >
              <option value="Technical + HR">Technical + HR</option>
              <option value="Technical Only">Technical Only</option>
              <option value="HR / Behavioral Only">HR / Behavioral Only</option>
            </FormField>

            <FormField
              label="Difficulty"
              as="select"
              name="difficulty"
              value={config.difficulty}
              onChange={handleConfigChange}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </FormField>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-3 font-bold text-ink">Focus Areas</h3>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {focusAreaOptions.map((focusArea) => (
                <label key={focusArea} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={config.focusAreas.includes(focusArea)}
                    onChange={() => handleFocusToggle(focusArea)}
                  />
                  {focusArea}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            className="mt-5 w-full"
            onClick={startMockInterview}
            disabled={starting}
          >
            <Play size={16} />
            {starting ? "Starting..." : "Start Mock Interview"}
          </Button>
        </Card>

        <Card
          title="Mock Interview Workspace"
          right={
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
              {questions.length ? "Live Session" : "Not Started"}
            </span>
          }
        >
          {questionNotice && <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{questionNotice}</p>}
          {!questions.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              <p className="font-bold text-ink">No interview session yet.</p>
              <p className="mt-1 text-sm">
                Click "Start Mock Interview" to generate AI questions.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setFeedback(questions[index].feedback || null);
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${
                      activeIndex === index
                        ? "bg-blue-50 text-forge"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    Q{index + 1}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-forge">
                  {questionSource === "role-based" ? "Role-based Practice Question" : "AI Interview Question"}
                </p>

                <h3 className="mt-1 font-bold text-ink">
                  {currentQuestion?.question}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Category: {currentQuestion?.category}
                </p>

                <div className="mt-4">
                  <FormField
                    label="Your Answer"
                    as="textarea"
                    value={currentQuestion?.answer || ""}
                    onChange={(e) =>
                      handleAnswerChange(activeIndex, e.target.value)
                    }
                    placeholder="Type your interview answer here..."
                  />
                </div>

                {currentQuestion?.feedback?.tip && (
                  <div className="mt-3 rounded-xl border-l-4 border-forge bg-blue-50 p-3 text-sm text-blue-900">
                    <p className="font-bold text-ink">AI Tip</p>
                    <p className="mt-1">{currentQuestion.feedback.tip}</p>
                  </div>
                )}

                {currentQuestion?.feedback?.scores && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <Score
                      label="Relevance"
                      value={currentQuestion.feedback.scores.relevance}
                    />
                    <Score
                      label="Clarity"
                      value={currentQuestion.feedback.scores.clarity}
                    />
                    <Score
                      label="Depth"
                      value={currentQuestion.feedback.scores.depth}
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={analyzeCurrentResponse} disabled={analyzing}>
                  <WandSparkles size={16} />
                  {analyzing ? "Analyzing..." : "Analyze Response"}
                </Button>

                <Button
                  variant="outline"
                  onClick={saveSession}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Session"}
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card title="AI Feedback">
          {!feedback ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              <p className="font-bold text-ink">No feedback yet.</p>
              <p className="mt-1 text-sm">
                Answer a question and click "Analyze Response."
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-green-50 p-4">
                <b className="text-green-700">
                  Overall Assessment: {feedback.overallAssessment}
                </b>

                <p className="mt-2">{feedback.summary}</p>
              </div>

              {feedback.tip && (
                <div className="rounded-xl border-l-4 border-forge bg-blue-50 p-4 text-blue-900">
                  <p className="font-bold text-ink">AI Tip</p>
                  <p className="mt-1">{feedback.tip}</p>
                </div>
              )}

              <Feedback title="Strengths" items={feedback.strengths || []} />

              <Feedback
                title="Areas to Improve"
                items={feedback.areasToImprove || []}
              />

              <Feedback
                title="Suggested Keywords"
                items={feedback.suggestedKeywords || []}
              />

              {feedback.improvedAnswer && (
                <div>
                  <h3 className="mb-2 font-bold text-ink">Improved Answer</h3>
                  <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-slate-700">
                    {feedback.improvedAnswer}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {showHistoryModal && (
        <HistoryModal
          sessionHistory={sessionHistory}
          selectedHistory={selectedHistory}
          setSelectedHistory={setSelectedHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedHistory(null);
          }}
          onLoadSession={loadHistorySession}
        />
      )}
    </AppLayout>
  );
}

function HistoryModal({
  sessionHistory,
  selectedHistory,
  setSelectedHistory,
  onClose,
  onLoadSession,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interview practice history"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-extrabold text-ink">
              Saved Interview History
            </h2>
            <p className="text-sm text-slate-500">
              View and reload your saved Q&A sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid max-h-[75vh] gap-4 overflow-y-auto p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            {sessionHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                <p className="font-bold text-ink">No saved history yet.</p>
                <p className="mt-1 text-sm">Save an interview session first.</p>
              </div>
            ) : (
              sessionHistory.map((session, index) => (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 ${
                    selectedHistory?.id === session.id
                      ? "border-forge bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="font-bold text-ink">
                    Session #{sessionHistory.length - index}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {session.config?.targetRole || "Interview Session"} •{" "}
                    {session.config?.interviewType || "Interview Type"} •{" "}
                    {session.config?.difficulty || "Difficulty"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {session.questions?.length || 0} saved question(s)
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedHistory(session)}
                    >
                      <Eye size={15} />
                      View
                    </Button>

                    <Button onClick={() => onLoadSession(session)}>
                      <RotateCcw size={15} />
                      Load
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {!selectedHistory ? (
              <div className="grid h-full min-h-[300px] place-items-center text-center text-slate-500">
                <div>
                  <History className="mx-auto mb-2" size={28} />
                  <p className="font-bold text-ink">Select a session</p>
                  <p className="mt-1 text-sm">
                    Click View to see saved questions, answers, tips, and
                    scores.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-white p-4">
                  <h3 className="font-bold text-ink">
                    {selectedHistory.config?.targetRole || "Interview Session"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedHistory.config?.interviewType || "Interview Type"}{" "}
                    • {selectedHistory.config?.experienceLevel || "Level"} •{" "}
                    {selectedHistory.config?.difficulty || "Difficulty"}
                  </p>

                  <Button
                    className="mt-3"
                    onClick={() => onLoadSession(selectedHistory)}
                  >
                    <RotateCcw size={16} />
                    Load This Session
                  </Button>
                </div>

                {(selectedHistory.questions || []).map(
                  (item, questionIndex) => (
                    <div
                      key={`${selectedHistory.id}-${questionIndex}`}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-xs font-bold text-forge">
                        Question {questionIndex + 1}
                      </p>

                      <h4 className="mt-1 font-bold text-ink">
                        {item.question}
                      </h4>

                      <p className="mt-1 text-xs text-slate-500">
                        Category: {item.category || "General"}
                      </p>

                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold text-ink">
                          Your Answer
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {item.answer || "No answer saved."}
                        </p>
                      </div>

                      {item.feedback?.tip && (
                        <div className="mt-3 rounded-lg border-l-4 border-forge bg-blue-50 p-3">
                          <p className="text-xs font-bold text-ink">AI Tip</p>
                          <p className="mt-1 text-sm text-blue-900">
                            {item.feedback.tip}
                          </p>
                        </div>
                      )}

                      {item.feedback?.scores && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <HistoryScore
                            label="Relevance"
                            value={item.feedback.scores.relevance}
                          />
                          <HistoryScore
                            label="Clarity"
                            value={item.feedback.scores.clarity}
                          />
                          <HistoryScore
                            label="Depth"
                            value={item.feedback.scores.depth}
                          />
                        </div>
                      )}

                      {item.feedback?.summary && (
                        <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
                          <p className="font-bold text-green-700">
                            Assessment:{" "}
                            {item.feedback.overallAssessment || "N/A"}
                          </p>

                          <p className="mt-1 text-slate-700">
                            {item.feedback.summary}
                          </p>
                        </div>
                      )}

                      {item.feedback?.improvedAnswer && (
                        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                          <p className="text-xs font-bold text-ink">
                            Improved Answer
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {item.feedback.improvedAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Score({ label, value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div>
      <p>{label}</p>
      <div className="mt-1 h-2 rounded bg-slate-100">
        <div
          className="h-2 rounded bg-forge"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-500">{safeValue}/100</p>
    </div>
  );
}

function HistoryScore({ label, value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div className="rounded-lg bg-white p-2">
      <div className="flex items-center justify-between">
        <p>{label}</p>
        <p className="font-bold text-forge">{safeValue}/100</p>
      </div>

      <div className="mt-1 h-2 rounded bg-slate-100">
        <div
          className="h-2 rounded bg-forge"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function Feedback({ title, items = [] }) {
  return (
    <div>
      <h3 className="mb-2 font-bold text-ink">{title}</h3>

      {items.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-slate-600">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500">No feedback available.</p>
      )}
    </div>
  );
}

function buildProfilePayload(profile = {}) {
  return {
    fullName: profile?.fullName || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    targetRole: profile?.targetRole || "",
    summary: profile?.summary || "",
    education: profile?.education || null,
    experience: profile?.experience || [],
    skills: profile?.skills || [],
    projects: profile?.projects || [],
    certifications: profile?.certifications || [],
  };
}
