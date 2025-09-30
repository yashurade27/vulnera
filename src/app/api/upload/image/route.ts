import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 4MB" },
        { status: 400 }
      );
    }

    // Upload to Uploadthing
    const uploadResult = await utapi.uploadFiles([file]);

    if (!uploadResult || uploadResult.length === 0) {
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );
    }

    const uploadedFile = uploadResult[0];

    if (uploadedFile.error) {
      return NextResponse.json(
        { error: uploadedFile.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: uploadedFile.data?.url,
      fileId: uploadedFile.data?.key,
      name: uploadedFile.data?.name,
      size: uploadedFile.data?.size,
    });

  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
