import { execFile } from "node:child_process";
import { access, copyFile, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname, basename, dirname, relative } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const RAW_DIR = "public/raw_assets";
const ASSETS_DIR = "public/assets";
const IMAGE_EXTS = new Set([".webp", ".jpg", ".jpeg", ".png"]);
const VIDEO_EXTS = new Set([".mp4"]);
const MAX_WIDTH = 1600;
const QUALITY = 78;

async function exists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function walk(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(full)));
        } else {
            files.push(full);
        }
    }
    return files;
}

function mirrorPath(rawFile: string, rawRoot: string, assetsRoot: string): string {
    return join(assetsRoot, relative(rawRoot, rawFile));
}

function imageWebpPath(rawFile: string, rawRoot: string, assetsRoot: string): string {
    const rel = relative(rawRoot, rawFile);
    const base = basename(rel, extname(rel));
    const dir = dirname(rel);
    return join(assetsRoot, dir === "." ? "" : dir, `${base}.webp`);
}

function videoPosterPath(videoOutFile: string): string {
    return join(dirname(videoOutFile), `${basename(videoOutFile, extname(videoOutFile))}.webp`);
}

async function extractVideoPoster(videoFile: string, posterFile: string): Promise<void> {
    const tempDir = await mkdtemp(join(tmpdir(), "compress-raw-assets-"));
    const framePath = join(tempDir, "frame.jpg");
    try {
        await execFileAsync("ffmpeg", [
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            "0",
            "-i",
            videoFile,
            "-vframes",
            "1",
            "-update",
            "1",
            framePath,
        ]);
        await sharp(framePath)
            .rotate()
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 6 })
            .toFile(posterFile);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("ENOENT") || message.includes("not found")) {
            throw new Error("ffmpeg not found — install it with: brew install ffmpeg");
        }
        throw error;
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

async function processImage(rawFile: string, rawRoot: string, assetsRoot: string) {
    const outFile = imageWebpPath(rawFile, rawRoot, assetsRoot);
    if (await exists(outFile)) {
        console.log(`skip  ${relative(process.cwd(), outFile)} (already exists)`);
        return;
    }

    await mkdir(dirname(outFile), { recursive: true });

    const before = (await stat(rawFile)).size;
    await sharp(rawFile)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 6 })
        .toFile(outFile);

    const after = (await stat(outFile)).size;
    console.log(
        `done  ${relative(process.cwd(), rawFile)} -> ${relative(process.cwd(), outFile)} ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`,
    );
}

async function processVideo(rawFile: string, rawRoot: string, assetsRoot: string) {
    const outFile = mirrorPath(rawFile, rawRoot, assetsRoot);
    const posterFile = videoPosterPath(outFile);
    const hasVideo = await exists(outFile);
    const hasPoster = await exists(posterFile);

    if (hasVideo && hasPoster) {
        console.log(`skip  ${relative(process.cwd(), outFile)} (already exists)`);
        return;
    }

    await mkdir(dirname(outFile), { recursive: true });

    if (!hasVideo) {
        const before = (await stat(rawFile)).size;
        await copyFile(rawFile, outFile);
        console.log(
            `copy ${relative(process.cwd(), rawFile)} -> ${relative(process.cwd(), outFile)} ${(before / 1024).toFixed(0)}KB`,
        );
    }

    if (!hasPoster) {
        await extractVideoPoster(rawFile, posterFile);
        const after = (await stat(posterFile)).size;
        console.log(
            `poster ${relative(process.cwd(), rawFile)} -> ${relative(process.cwd(), posterFile)} ${(after / 1024).toFixed(0)}KB`,
        );
    }
}

async function processFile(rawFile: string, rawRoot: string, assetsRoot: string) {
    const ext = extname(rawFile).toLowerCase();
    if (IMAGE_EXTS.has(ext)) {
        await processImage(rawFile, rawRoot, assetsRoot);
    } else if (VIDEO_EXTS.has(ext)) {
        await processVideo(rawFile, rawRoot, assetsRoot);
    }
}

async function main() {
    const root = process.cwd();
    const rawRoot = join(root, RAW_DIR);
    const assetsRoot = join(root, ASSETS_DIR);

    if (!(await exists(rawRoot))) {
        console.log(`skip  ${RAW_DIR} (directory not found)`);
        return;
    }

    const files = await walk(rawRoot);
    for (const f of files) {
        await processFile(f, rawRoot, assetsRoot);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
