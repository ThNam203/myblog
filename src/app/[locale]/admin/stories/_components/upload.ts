import { createClient } from "@/lib/supabase/client";
import { createUploadUrl } from "@/lib/actions/stories";

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 0.78;

/** Mirrors scripts/compress-raw-assets.ts (max width 1600, webp q78) in the browser. */
export async function compressImageToWebp(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob) throw new Error("Failed to encode webp");
    return blob;
}

export function sanitizeFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

/**
 * Uploads straight from the browser to the `stories` bucket via a signed URL
 * issued by an owner-checked server action. Returns the public URL.
 */
export async function uploadStoryMedia(path: string, data: Blob): Promise<string> {
    const ticket = await createUploadUrl(path);
    if (ticket.error || !ticket.token || !ticket.path || !ticket.publicUrl) {
        throw new Error(ticket.error ?? "Failed to create upload URL");
    }

    const supabase = createClient();
    const { error } = await supabase.storage
        .from("stories")
        .uploadToSignedUrl(ticket.path, ticket.token, data);
    if (error) throw new Error(error.message);

    return ticket.publicUrl;
}
