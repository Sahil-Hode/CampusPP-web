import { NextRequest, NextResponse } from "next/server";
import {
  buildAlertId,
  getStudentNotes,
  getStudentProfile,
  getStudentRisk,
  saveStudentProfile,
  saveStudentRisk,
} from "@/lib/facultyAnnotationsStore";

const PERFORMANCE_API = "https://campuspp-f7qx.onrender.com/api";
const CORE_API = "https://techxpression-hackathon.onrender.com/api";

function isFaculty(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const role = (req.headers.get("x-user-role") || "FACULTY").toUpperCase();
  return Boolean(auth) && role.includes("FACULTY");
}

async function fetchStudentFromCore(studentId: string, authorization: string | null) {
  const res = await fetch(`${CORE_API}/faculty/students`, {
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = await res.json();
  const all = Array.isArray(json?.data) ? json.data : [];
  const found = all.find((s: any) => String(s?.studentId) === studentId);
  if (!found) return null;

  const profile = {
    name: found?.name || studentId,
    studentId,
    instituteId: found?.instituteId,
    email: found?.email,
    classes: found?.classes,
    Course: found?.Course,
  };

  saveStudentProfile(profile);
  return profile;
}

async function fetchRisk(studentId: string, authorization: string | null) {
  const res = await fetch(`${PERFORMANCE_API}/student/public/performance/${studentId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = await res.json();
  const data = json?.data;
  const perf = data?.currentPerformance;
  if (!perf) return null;

  const risk = {
    finalRisk: perf?.predictiveIntelligence?.academicStability?.finalRisk ?? 0,
    score: perf?.score ?? 0,
    riskLevel: perf?.riskLevel ?? "Low",
    trend: perf?.trends ?? "Stable",
    recommendations: perf?.recommendations ?? [],
    concerns: perf?.concerns ?? [],
    strengths: perf?.strengths ?? [],
  };

  saveStudentRisk(studentId, risk);
  if (data?.studentName) {
    saveStudentProfile({
      studentId,
      name: data.studentName,
    });
  }

  return risk;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    if (!isFaculty(req)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: faculty access required" },
        { status: 403 }
      );
    }

    const { studentId } = await params;
    const id = String(studentId || "").trim();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "studentId is required" },
        { status: 400 }
      );
    }

    const auth = req.headers.get("authorization");

    const [coreProfile, risk] = await Promise.all([
      fetchStudentFromCore(id, auth),
      fetchRisk(id, auth),
    ]);

    const profile = coreProfile || getStudentProfile(id);
    const latestRisk = risk || getStudentRisk(id);

    if (!profile && !latestRisk) {
      return NextResponse.json(
        { success: false, message: "Student not found in faculty institute" },
        { status: 404 }
      );
    }

    const alertId = buildAlertId(id, latestRisk?.riskLevel || "Low", (latestRisk?.finalRisk ?? 0) >= 50);
    const notes = getStudentNotes(id)
      .filter((n) => n.alertId === alertId)
      .map((n) => ({
        _id: n._id,
        facultyName: n.facultyName,
        note: n.note,
        timestamp: n.timestamp,
      }));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          name: profile?.name || id,
          studentId: id,
          instituteId: profile?.instituteId,
          email: profile?.email,
          classes: profile?.classes,
          Course: profile?.Course,
        },
        alertId,
        risk: latestRisk || {
          finalRisk: 0,
          score: 0,
          riskLevel: "Low",
          trend: "Stable",
          recommendations: [],
          concerns: [],
          strengths: [],
        },
        notes,
      },
    });
  } catch (error) {
    console.error("[faculty-annotations][context]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
