/**
 * One-off migration: uploads media referenced by src/data/stories.ts to the
 * Supabase "stories" bucket and upserts the groups into story_groups, with
 * src/cover/poster rewritten to storage public URLs. Music paths (/music/*)
 * stay in public/ and are not touched.
 *
 * Run: npm run migrate-stories   (reads .env.local for the Supabase keys)
 */
import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { exit } from "node:process";
import { createClient } from "@supabase/supabase-js";
import { stories } from "../src/data/stories";
import { storyGroupSchema } from "../src/lib/stories/story-schema";

const BUCKET = "stories";

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing environment variable ${name} (run via npm run migrate-stories)`);
        exit(1);
    }
    return value;
}

const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!secretKey) {
    console.error("Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local");
    exit(1);
}

const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const CONTENT_TYPES: Record<string, string> = {
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".mp4": "video/mp4",
};

// Uploads one public/-relative path into <groupId>/<basename>, returns the
// public URL. Caches per source path so covers reused as item srcs upload once.
const uploaded = new Map<string, string>();

async function migrateFile(groupId: string, publicPath: string): Promise<string> {
    const cacheKey = `${groupId}:${publicPath}`;
    const cached = uploaded.get(cacheKey);
    if (cached) return cached;

    const ext = extname(publicPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) throw new Error(`Unsupported media extension "${ext}" in ${publicPath}`);

    const file = await readFile(join("public", publicPath));
    const objectPath = `${groupId}/${basename(publicPath)}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, file, { contentType, upsert: true });
    if (error) throw new Error(`Upload failed for ${publicPath}: ${error.message}`);

    const { publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data;
    console.log(`uploaded ${publicPath} -> ${objectPath}`);
    uploaded.set(cacheKey, publicUrl);
    return publicUrl;
}

async function main() {
    for (const group of stories) {
        const cover = await migrateFile(group.id, group.cover);
        const items = [];
        for (const item of group.items) {
            const src = await migrateFile(group.id, item.src);
            if (item.type === "video") {
                items.push({
                    ...item,
                    src,
                    poster: item.poster ? await migrateFile(group.id, item.poster) : undefined,
                });
            } else {
                items.push({ ...item, src });
            }
        }

        const parsed = storyGroupSchema.parse({ ...group, cover, items });
        const { error } = await supabase.from("story_groups").upsert({
            id: parsed.id,
            title: parsed.title,
            cover: parsed.cover,
            items: parsed.items,
            created_at: parsed.createdAt,
            active_for_ms: parsed.activeForMs ?? null,
        });
        if (error) throw new Error(`Upsert failed for group "${group.id}": ${error.message}`);
        console.log(`migrated group "${group.id}" (${items.length} item(s))`);
    }
    console.log(`done: ${stories.length} group(s) migrated`);
}

main().catch((error) => {
    console.error(error);
    exit(1);
});
