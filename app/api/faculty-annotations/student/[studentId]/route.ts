import { NextRequest, NextResponse } from "next/server";
import { getStudentNotes } from "@/lib/facultyAnnotationsStore";

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

    const all = getStudentNotes(id);

    return NextResponse.json({
      success: true,
      count: all.length,
      data: all.map((n) => ({
        _id: n._id,
        facultyName: n.facultyName,
        alertId: n.alertId,
        note: n.note,
        timestamp: n.timestamp,
        type: "faculty_annotation",
      })),
    });
  } catch (error) {
    console.error("[faculty-annotations][student-notes]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
