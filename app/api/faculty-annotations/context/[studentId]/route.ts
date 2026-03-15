import { NextRequest, NextResponse } from "next/server";
import { proxyFacultyAnnotations } from "@/lib/facultyAnnotationsApi";

function isFaculty(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const role = (req.headers.get("x-user-role") || "FACULTY").toUpperCase();
  return Boolean(auth) && role.includes("FACULTY");
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

    const result = await proxyFacultyAnnotations(
      req,
      `/faculty-annotations/context/${encodeURIComponent(id)}`,
      {
        method: "GET",
      }
    );

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error("[faculty-annotations][context]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
