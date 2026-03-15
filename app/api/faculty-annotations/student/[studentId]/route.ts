import { NextRequest, NextResponse } from "next/server";
import { proxyFacultyAnnotations } from "@/lib/facultyAnnotationsApi";

function hasAccess(req: NextRequest) {
  return Boolean(req.headers.get("authorization"));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    if (!hasAccess(req)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
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
      `/faculty-annotations/student/${encodeURIComponent(id)}`,
      {
        method: "GET",
      }
    );

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error("[faculty-annotations][student-notes]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
