export type RiskLevel = "High" | "Medium" | "Low";

export interface FacultyAnnotation {
  _id: string;
  studentId: string;
  alertId: string;
  resolvedFromBackend: boolean;
  facultyName: string;
  note: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  createdAt: string;
}

export interface StudentProfileLite {
  name: string;
  studentId: string;
  instituteId?: string;
  email?: string;
  classes?: string;
  Course?: string;
}

export interface RiskContext {
  finalRisk: number;
  score: number;
  riskLevel: RiskLevel;
  trend: string;
  recommendations: string[];
  concerns: string[];
  strengths: string[];
}

const notes: FacultyAnnotation[] = [];
const studentProfiles = new Map<string, StudentProfileLite>();
const studentRiskCache = new Map<string, RiskContext>();

const uid = () => `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;

export function buildAlertId(studentId: string, riskLevel: string, isAtRisk = true) {
  const level = (riskLevel || "low").toLowerCase();
  const state = isAtRisk ? "critical" : "stable";
  return `${level}_risk_${state}_${studentId}`;
}

export function saveStudentProfile(profile: StudentProfileLite) {
  if (!profile?.studentId) return;
  studentProfiles.set(profile.studentId, profile);
}

export function getStudentProfile(studentId: string) {
  return studentProfiles.get(studentId);
}

export function saveStudentRisk(studentId: string, risk: RiskContext) {
  if (!studentId || !risk) return;
  studentRiskCache.set(studentId, risk);
}

export function getStudentRisk(studentId: string) {
  return studentRiskCache.get(studentId);
}

export function addFacultyAnnotation(input: {
  studentId: string;
  alertId: string;
  resolvedFromBackend: boolean;
  facultyName: string;
  note: string;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const created: FacultyAnnotation = {
    _id: uid(),
    studentId: input.studentId,
    alertId: input.alertId,
    resolvedFromBackend: input.resolvedFromBackend,
    facultyName: input.facultyName,
    note: input.note,
    metadata: input.metadata,
    timestamp: now,
    createdAt: now,
  };
  notes.unshift(created);
  return created;
}

export function listFacultyAnnotations(params: {
  studentId: string;
  alertId?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));

  const filtered = notes.filter((n) => {
    if (n.studentId !== params.studentId) return false;
    if (params.alertId && n.alertId !== params.alertId) return false;
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export function getAlertThread(studentId: string, alertId: string) {
  return notes
    .filter((n) => n.studentId === studentId && n.alertId === alertId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getStudentNotes(studentId: string) {
  return notes
    .filter((n) => n.studentId === studentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
