import { NextRequest, NextResponse } from "next/server";
import { proxyFacultyAnnotations } from "@/lib/facultyAnnotationsApi";

function hasAccess(req: NextRequest) {
  return Boolean(req.headers.get("authorization"));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    if (!hasAccess(req)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = (searchParams.get("studentId") || "").trim();
    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId query param is required" },
        { status: 400 }
      );
    }

    const { alertId } = await params;
    const result = await proxyFacultyAnnotations(
      req,
      `/faculty-annotations/alerts/${encodeURIComponent(alertId)}/notes?studentId=${encodeURIComponent(studentId)}`,
      {
        method: "GET",
      }
    );

    return NextResponse.json(result.payload, {
      status: result.status,
    });
  } catch (error) {
    console.error("[faculty-annotations][alert-thread]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
