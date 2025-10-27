import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { type RouteParams } from "@/lib/next";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_SECRET,
});

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams<{ fileId: string }>
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

  const { fileId } = await params;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Delete from Uploadthing
    const deleteResult = await utapi.deleteFiles([fileId]);

    if (!deleteResult.success || deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "File not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      fileId: fileId,
    });

  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
