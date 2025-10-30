import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Validate magic numbers (file signature)
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isValidImage = 
      // JPEG
      (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) ||
      // PNG
      (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) ||
      // GIF
      (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) ||
      // WebP
      (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50);

    if (!isValidImage) {
      return NextResponse.json(
        { error: "Invalid image file format" },
        { status: 400 }
      );
    }

    // Convert back to File for upload
    const validatedFile = new File([buffer], file.name, { type: file.type });

    // Upload to Uploadthing
    const uploadResult = await utapi.uploadFiles([validatedFile]);

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
