import { NextRequest, NextResponse } from "next/server";
import {
  addFacultyAnnotation,
  buildAlertId,
  listFacultyAnnotations,
  saveStudentProfile,
  saveStudentRisk,
} from "@/lib/facultyAnnotationsStore";

const PERFORMANCE_API = "https://campuspp-f7qx.onrender.com/api";

function getFacultyName(req: NextRequest) {
  return req.headers.get("x-user-name") || "Faculty";
}

function checkFacultyAccess(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const role = (req.headers.get("x-user-role") || "FACULTY").toUpperCase();
  return Boolean(auth) && role.includes("FACULTY");
}

async function resolveRisk(studentId: string, authHeader?: string | null) {
  const res = await fetch(`${PERFORMANCE_API}/student/public/performance/${studentId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = await res.json();
  const d = json?.data;
  const perf = d?.currentPerformance;
  if (!d || !perf) return null;

  saveStudentProfile({
    studentId: d.studentId || studentId,
    name: d.studentName || studentId,
  });

  saveStudentRisk(studentId, {
    finalRisk: perf?.predictiveIntelligence?.academicStability?.finalRisk ?? 0,
    score: perf?.score ?? 0,
    riskLevel: perf?.riskLevel ?? "Low",
    trend: perf?.trends ?? "Stable",
    recommendations: perf?.recommendations ?? [],
    concerns: perf?.concerns ?? [],
    strengths: perf?.strengths ?? [],
  });

  return perf;
}

export async function POST(req: NextRequest) {
  try {
    if (!checkFacultyAccess(req)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: faculty access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const studentId = String(body?.studentId || "").trim();
    const note = String(body?.note || "").trim();
    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : undefined;

    if (!studentId || !note || note.length < 2 || note.length > 1000) {
      return NextResponse.json(
        { success: false, message: "studentId and note (2..1000 chars) are required" },
        { status: 400 }
      );
    }

    const auth = req.headers.get("authorization");
    const resolvedPerf = await resolveRisk(studentId, auth);

    if (!resolvedPerf && !body?.alertId) {
      return NextResponse.json(
        { success: false, message: "Student not found in faculty institute" },
        { status: 404 }
      );
    }

    const resolvedFromBackend = !body?.alertId;
    const alertId = String(body?.alertId || buildAlertId(studentId, resolvedPerf?.riskLevel || "Low", resolvedPerf?.isAtRisk));

    const created = addFacultyAnnotation({
      studentId,
      alertId,
      resolvedFromBackend,
      facultyName: getFacultyName(req),
      note,
      metadata,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Faculty annotation added successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[faculty-annotations][POST]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!checkFacultyAccess(req)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: faculty access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = (searchParams.get("studentId") || "").trim();
    const alertId = (searchParams.get("alertId") || "").trim() || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId query param is required" },
        { status: 400 }
      );
    }

    const { data, pagination } = listFacultyAnnotations({ studentId, alertId, page, limit });

    return NextResponse.json({
      success: true,
      data,
      pagination,
    });
  } catch (error) {
    console.error("[faculty-annotations][GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
