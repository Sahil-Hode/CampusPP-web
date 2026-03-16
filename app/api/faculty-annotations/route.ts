import { NextRequest, NextResponse } from "next/server";
import { proxyFacultyAnnotations } from "@/lib/facultyAnnotationsApi";

type ApiPayload = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

type NotificationDispatchResult = {
  attempted: boolean;
  sent: boolean;
  status?: number;
  message?: string;
};

function toApiPayload(value: unknown): ApiPayload {
  if (value && typeof value === "object") {
    return value as ApiPayload;
  }
  return {};
}

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

    const annotationResponse = toApiPayload(result.payload);

    // Best-effort push notification trigger.
    // Annotation creation should still succeed even if notification dispatch fails.
    let notification: NotificationDispatchResult = {
      attempted: false,
      sent: false,
    };

    if (result.status >= 200 && result.status < 300 && annotationResponse.success !== false) {
      notification.attempted = true;
      try {
        const notifyResult = await proxyFacultyAnnotations(req, "/notifications/send", {
          method: "POST",
          body: JSON.stringify({
            title: "New Faculty Annotation",
            message: `${payload.facultyName} added an annotation for student ${studentId}.`,
            type: "faculty_annotation",
            severity: "info",
            studentId,
            targetStudentId: studentId,
            metadata: {
              source: "faculty_annotation",
            },
          }),
        });

        const notifyPayload = toApiPayload(notifyResult.payload);
        notification = {
          attempted: true,
          sent: notifyResult.status >= 200 && notifyResult.status < 300 && notifyPayload.success !== false,
          status: notifyResult.status,
          message: typeof notifyPayload.message === "string" ? notifyPayload.message : undefined,
        };
      } catch (notificationError) {
        console.error("[faculty-annotations][POST][notify]", notificationError);
        notification = {
          attempted: true,
          sent: false,
          message: "Notification dispatch failed",
        };
      }
    }

    return NextResponse.json(
      {
        ...annotationResponse,
        notification,
      },
      { status: result.status }
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
