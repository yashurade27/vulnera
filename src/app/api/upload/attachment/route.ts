import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
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

    // Validate file type (allow common attachment types)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
      "image/png",
      "image/jpeg",
      "image/gif",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Allowed types: PDF, DOC, DOCX, TXT, ZIP, PNG, JPG, GIF, CSV, XLS, XLSX" },
        { status: 400 }
      );
    }

    // Validate file size (20MB max for attachments)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 20MB" },
        { status: 400 }
      );
    }

    // Validate magic numbers (file signature) for security
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const isValidFile = 
      // PDF
      (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) ||
      // PNG
      (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) ||
      // JPEG
      (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) ||
      // GIF
      (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) ||
      // ZIP
      (bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05)) ||
      // DOC/DOCX (compound file)
      (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) ||
      // Text files (no magic number, just verify it's valid text)
      file.type === "text/plain" || file.type === "text/csv";

    if (!isValidFile) {
      return NextResponse.json(
        { error: "Invalid or corrupted file format" },
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
      type: uploadedFile.data?.type,
    });

  } catch (error) {
    console.error("Attachment upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
