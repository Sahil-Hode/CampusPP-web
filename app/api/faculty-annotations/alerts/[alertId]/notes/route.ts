import { NextRequest, NextResponse } from "next/server";
import { getAlertThread } from "@/lib/facultyAnnotationsStore";

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
    const thread = getAlertThread(studentId, alertId).map((n) => ({
      facultyName: n.facultyName,
      note: n.note,
      timestamp: n.timestamp,
    }));

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        alertId,
        notes: thread,
      },
    });
  } catch (error) {
    console.error("[faculty-annotations][alert-thread]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
