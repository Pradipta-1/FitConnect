import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name || "image.png";
    const extension = originalName.split(".").pop() || "png";
    const filename = `${uniqueSuffix}.${extension}`;

    const { supabaseAdmin } = await import("@/lib/supabase");

    // Try Supabase Storage first if configured
    if (supabaseAdmin) {
      try {
        const bucketName = "message-images";

        // Upload to Supabase bucket
        const { error } = await supabaseAdmin.storage
          .from(bucketName)
          .upload(filename, buffer, {
            contentType: file.type || "image/png",
            upsert: true,
          });

        if (!error) {
          const { data: publicData } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(filename);

          if (publicData?.publicUrl) {
            return NextResponse.json({ success: true, url: publicData.publicUrl });
          }
        } else {
          console.warn("Supabase upload returned error:", error.message);
        }
      } catch (sbErr) {
        console.warn("Supabase storage unreachable, falling back to local storage:", sbErr);
      }
    }

    // High-reliability local storage fallback
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (e: any) {
    console.error("Error uploading file:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
