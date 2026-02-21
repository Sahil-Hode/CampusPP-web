"use client";

import { useEffect, useState, useRef } from "react";
import { ShieldCheck, Upload, FileText, Loader2, CheckCircle2, AlertCircle, Pencil, X, Eye, ScrollText } from "lucide-react";
import { apiRequest } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileState = {
  name: string;
  email: string;
  classes: string;
  Course: string;
  language: string;
  studentId: string;
  instituteName: string;
};

const INITIAL_PROFILE: ProfileState = {
  name: "Student",
  email: "",
  classes: "",
  Course: "",
  language: "",
  studentId: "",
  instituteName: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const p = err as Record<string, unknown>;
    const msg = p.message || p.error || p.details;
    if (typeof msg === "string" && msg.trim()) return msg;
    if (typeof p.statusCode === "number") return `Request failed with status ${p.statusCode}`;
  }
  return "Request failed";
};

const isRetryableUploadFieldError = (err: unknown): boolean => {
  if (typeof err !== "object" || err === null) return false;
  const p = err as Record<string, unknown>;
  const statusCode = typeof p.statusCode === "number" ? p.statusCode : undefined;
  if (statusCode && statusCode >= 500) return false;
  const text = `${p.message || ""} ${p.error || ""} ${p.details || ""}`.toLowerCase();
  return /unexpected field|no file|missing file|req\.file|invalid field/i.test(text);
};

const pickString = (src: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const val = src[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
};

const getInitials = (name: string): string => {
  const parts = name.split(" ").filter(Boolean);
  if (!parts.length) return "S";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
};

// ─── Profile extractor ────────────────────────────────────────────────────────
// Backend getProfile returns: { success, data: { _id, name, email, studentId, profilePhoto, resumeUploadedAt, ... } }
// Backend uploadProfilePhoto returns: { success, data: { profilePhoto: "data:image/..." } }
// Backend uploadResume returns: { success, data: { resumeTextLength, resumeUploadedAt, resumePreview } }

type ExtractedProfile = {
  profile: ProfileState;
  photoUrl: string;          // base64 data URI or empty
  resumeUploadedAt: string;  // ISO date string or empty
  resumeText: string;        // extracted plain text of resume
};

const extractProfile = (raw: unknown): ExtractedProfile => {
  const root = (raw as Record<string, unknown>) ?? {};
  // Backend returns flat student doc in data
  const data = (root.data as Record<string, unknown>) ?? {};

  // getProfile → data is the student object directly
  // uploadProfilePhoto → data.profilePhoto is the base64 string
  const student: Record<string, unknown> = data;

  const profile: ProfileState = {
    name:          pickString(student, ["name", "fullName"]) || "Student",
    email:         pickString(student, ["email"]),
    classes:       pickString(student, ["classes", "class"]),
    Course:        pickString(student, ["Course", "course", "subject"]),
    language:      pickString(student, ["language"]),
    studentId:     pickString(student, ["studentId", "id", "_id"]),
    instituteName: pickString(student, ["instituteName", "institute"]),
  };

  // Photo is stored as base64 data URI
  const photoUrl = pickString(student, ["profilePhoto", "photo", "avatar"]);

  // Resume: backend stores text only, no URL. Use resumeUploadedAt to know if uploaded.
  const resumeUploadedAt = pickString(student, ["resumeUploadedAt"]);

  // Resume extracted text
  const resumeText = pickString(student, ["resumeText", "resume_text", "resumeContent"]);

  return { profile, photoUrl, resumeUploadedAt, resumeText };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileForm() {
  const [profile, setProfile] = useState<ProfileState>(INITIAL_PROFILE);
  const [photoUrl, setPhotoUrl] = useState("");
  const [resumeUploadedAt, setResumeUploadedAt] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // ── Shared Tailwind class strings ──────────────────────────────────────────
  const inputBase =
    "w-full bg-slate-50 dark:bg-zinc-800/50 rounded-2xl py-3.5 px-4 text-sm font-bold border border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:border-cyan-300 dark:focus:border-cyan-500 transition";
  const readOnlyInput =
    "bg-slate-100 dark:bg-zinc-900/70 text-slate-700 dark:text-slate-300 cursor-not-allowed";

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/student/profile", { method: "GET" });
      const parsed = extractProfile(res);
      setProfile(parsed.profile);
      if (parsed.photoUrl) setPhotoUrl(parsed.photoUrl);
      if (parsed.resumeUploadedAt) setResumeUploadedAt(parsed.resumeUploadedAt);
      if (parsed.resumeText) setResumeText(parsed.resumeText);

      // Cache name/email for other parts of the app
      if (typeof window !== "undefined") {
        if (parsed.profile.name) localStorage.setItem("user_name", parsed.profile.name);
        if (parsed.profile.email) localStorage.setItem("user_email", parsed.profile.email);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Close modal on backdrop click ──────────────────────────────────────────
  const handleModalBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setShowResumeModal(false);
    }
  };

  // ── Close modal on Escape key ──────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowResumeModal(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Upload helper with field-name retry ────────────────────────────────────
  const uploadWithCandidates = async (
    endpoint: string,
    file: File,
    fieldCandidates: string[]
  ): Promise<unknown> => {
    let lastError: unknown = null;
    for (const field of fieldCandidates) {
      try {
        const form = new FormData();
        form.append(field, file, file.name);
        return await apiRequest(endpoint, { method: "POST", body: form });
      } catch (err) {
        lastError = err;
        if (!isRetryableUploadFieldError(err)) break;
      }
    }
    throw lastError ?? new Error("Upload failed");
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  // Backend updateProfile accepts: name, classes, Course, language
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, string> = {};
      if (profile.name.trim())     payload.name     = profile.name.trim();
      if (profile.classes.trim())  payload.classes  = profile.classes.trim();
      if (profile.Course.trim())   payload.Course   = profile.Course.trim();
      if (profile.language.trim()) payload.language = profile.language.trim();

      await apiRequest("/student/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSuccess("Profile updated successfully.");
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Photo upload ───────────────────────────────────────────────────────────
  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    setSuccess("");
    try {
      // Backend POST /student/profile/photo → multer field: "photo"
      const uploadRes = await uploadWithCandidates(
        "/student/profile/photo",
        file,
        ["photo", "profilePhoto", "avatar", "image", "file"]
      );
      // Response: { success, data: { profilePhoto: "data:image/..." } }
      const parsed = extractProfile(uploadRes);
      if (parsed.photoUrl) setPhotoUrl(parsed.photoUrl);
      setSuccess("Profile photo updated.");
      await fetchProfile();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPhotoUploading(false);
    }
  };

  // ── Resume upload ──────────────────────────────────────────────────────────
  const handleResumeUpload = async (file: File | null) => {
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Please upload resume in PDF format only.");
      return;
    }
    setResumeUploading(true);
    setError("");
    setSuccess("");
    try {
      // Backend POST /student/profile/resume → multer field: "resume"
      // Response: { success, data: { resumeTextLength, resumeUploadedAt, resumePreview } }
      const uploadRes = await uploadWithCandidates(
        "/student/profile/resume",
        file,
        ["resume", "resumeFile", "file", "document", "pdf"]
      );

      // Extract fields from upload response
      const root = (uploadRes as Record<string, unknown>) ?? {};
      const data = (root.data as Record<string, unknown>) ?? {};

      const uploadedAt =
        typeof data.resumeUploadedAt === "string" ? data.resumeUploadedAt : "";
      // resumePreview is the first 300 chars backend sends back
      const preview =
        typeof data.resumePreview === "string" ? data.resumePreview : "";

      setResumeUploadedAt(uploadedAt || new Date().toISOString());
      // Pre-populate preview text; full text will come on next fetchProfile
      if (preview) setResumeText(preview);

      setSuccess("Resume uploaded and processed successfully.");
      // Fetch full profile to get complete resumeText
      await fetchProfile();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResumeUploading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatResumeDate = (iso: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-zinc-800 flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-cyan-500" size={18} />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-950 p-5 sm:p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-zinc-800 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-white flex items-center justify-center overflow-hidden flex-shrink-0">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-black">
                  {getInitials(profile.name)}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                My Profile
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                Student Identity &amp; Documents
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                {/* Upload Avatar */}
                <label className="h-10 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-200 inline-flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition">
                  {photoUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Avatar
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      handlePhotoUpload(e.target.files?.[0] ?? null)
                    }
                  />
                </label>

                {/* Upload Resume */}
                <label className="h-10 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-200 inline-flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition">
                  {resumeUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileText size={14} />
                  )}
                  Resume
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) =>
                      handleResumeUpload(e.target.files?.[0] ?? null)
                    }
                  />
                </label>

                {/* Cancel editing */}
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError("");
                    setSuccess("");
                    fetchProfile(); // revert any unsaved local changes
                  }}
                  className="h-10 w-10 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-200 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                  aria-label="Cancel editing"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              /* Edit button */
              <button
                onClick={() => {
                  setIsEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="h-10 w-10 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-200 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                aria-label="Edit profile"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── Feedback banner ── */}
        {(error || success) && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${
              error
                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
            }`}
          >
            {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {error || success}
          </div>
        )}

        {/* ── Form grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Full Name — editable */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Full Name
            </label>
            <input
              className={`${inputBase} ${!isEditing ? readOnlyInput : "dark:text-white"}`}
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          {/* System Email — always locked */}
          <div className="opacity-90">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                System Email
              </label>
              <ShieldCheck size={14} className="text-emerald-500" />
            </div>
            <input
              className={`${inputBase} ${readOnlyInput}`}
              value={profile.email}
              disabled
            />
          </div>

          {/* Student ID — always locked */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Student ID
            </label>
            <input
              className={`${inputBase} ${readOnlyInput}`}
              value={profile.studentId}
              disabled
            />
          </div>

          {/* Institute — always locked */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Institute
            </label>
            <input
              className={`${inputBase} ${readOnlyInput}`}
              value={profile.instituteName}
              disabled
              placeholder="—"
            />
          </div>

          {/* Class — editable */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Class / Batch
            </label>
            <input
              className={`${inputBase} ${!isEditing ? readOnlyInput : "dark:text-white"}`}
              value={profile.classes}
              onChange={(e) =>
                setProfile({ ...profile, classes: e.target.value })
              }
              placeholder="e.g. FY-B.Tech-A"
              disabled={!isEditing}
            />
          </div>

          {/* Course — editable */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Course / Subject
            </label>
            <input
              className={`${inputBase} ${!isEditing ? readOnlyInput : "dark:text-white"}`}
              value={profile.Course}
              onChange={(e) =>
                setProfile({ ...profile, Course: e.target.value })
              }
              placeholder="e.g. Computer Science"
              disabled={!isEditing}
            />
          </div>

          {/* Language — editable */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Preferred Language
            </label>
            <input
              className={`${inputBase} ${!isEditing ? readOnlyInput : "dark:text-white"}`}
              value={profile.language}
              onChange={(e) =>
                setProfile({ ...profile, language: e.target.value })
              }
              placeholder="e.g. English"
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* ── Footer: resume status + save button ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-zinc-800">
          {/* Resume status + view button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileText size={14} className={resumeUploadedAt ? "text-cyan-500" : ""} />
              {resumeUploadedAt ? (
                <span className="text-cyan-600 dark:text-cyan-400">
                  Resume uploaded on {formatResumeDate(resumeUploadedAt)}
                </span>
              ) : (
                <span>No resume uploaded yet</span>
              )}
            </div>
            {/* View Resume button — only if text exists */}
            {resumeText && (
              <button
                onClick={() => setShowResumeModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200 transition"
              >
                <Eye size={13} />
                View Resume
              </button>
            )}
          </div>

          {/* Save button */}
          {isEditing && (
            <button
              className="h-12 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-[0.16em] text-xs disabled:opacity-60 transition hover:opacity-90"
              onClick={handleSave}
              disabled={saving || photoUploading || resumeUploading}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Resume Viewer Modal ── */}
      {showResumeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleModalBackdropClick}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center flex-shrink-0">
                  <ScrollText size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Resume Text
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                    Extracted content · {profile.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResumeModal(false)}
                className="h-8 w-8 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-slate-400 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                aria-label="Close resume viewer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Info pill */}
            <div className="px-6 pt-3 flex-shrink-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-zinc-800/60 rounded-lg px-3 py-1.5">
                <FileText size={11} />
                Plain text extracted from your uploaded PDF
              </div>
            </div>

            {/* Scrollable resume text */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                {resumeText}
              </pre>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-zinc-800 flex-shrink-0 bg-slate-50/60 dark:bg-zinc-900/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {resumeText.length.toLocaleString()} characters extracted
              </span>
              <button
                onClick={() => setShowResumeModal(false)}
                className="h-9 px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-wider text-[10px] transition hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}