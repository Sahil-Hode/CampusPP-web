import { NextRequest, NextResponse } from "next/server";
import { proxyFacultyAnnotations } from "@/lib/facultyAnnotationsApi";

export async function POST(req: NextRequest) {
  try {
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

    const payload = {
      ...body,
      studentId,
      note,
      metadata,
      facultyName: String(body?.facultyName || req.headers.get("x-user-name") || "Faculty").trim(),
    };

    const result = await proxyFacultyAnnotations(req, "/faculty-annotations", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(result.payload, { status: result.status });
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
    const { searchParams } = new URL(req.url);
    const studentId = (searchParams.get("studentId") || "").trim();

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId query param is required" },
        { status: 400 }
      );
    }

    const result = await proxyFacultyAnnotations(
      req,
      `/faculty-annotations?${searchParams.toString()}`,
      {
        method: "GET",
      }
    );

    return NextResponse.json(result.payload, {
      status: result.status,
    });
  } catch (error) {
    console.error("[faculty-annotations][GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
