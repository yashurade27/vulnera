import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

type HandlerContext = Parameters<typeof handler>[1];

async function normalizeResponseBody(response: Response): Promise<Response> {
  try {
    const clone = response.clone();
    const rawBody = await clone.text();
    const trimmed = rawBody.trim();

    if (trimmed === "" || trimmed === "null" || trimmed === "{}") {
      const fallbackBody = trimmed === "" ? "null" : trimmed;

      return new Response(fallbackBody, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
    }
  } catch (error) {
    console.error("Failed to normalize NextAuth response body", error);
  }

  return response;
}

async function handleAuthRequest(req: NextRequest, context: HandlerContext) {
  const response = await handler(req, context);
  if (response instanceof Response) {
    return normalizeResponseBody(response);
  }
  return response;
}

export async function GET(req: NextRequest, context: HandlerContext) {
  return handleAuthRequest(req, context);
}

export async function POST(req: NextRequest, context: HandlerContext) {
  return handleAuthRequest(req, context);
}

export async function PUT(req: NextRequest, context: HandlerContext) {
  return handleAuthRequest(req, context);
}

export async function PATCH(req: NextRequest, context: HandlerContext) {
  return handleAuthRequest(req, context);
}

export async function DELETE(req: NextRequest, context: HandlerContext) {
  return handleAuthRequest(req, context);
}