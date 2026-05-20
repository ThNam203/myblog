import { access, mkdir, readdir, stat } from "node:fs/promises";
import { join, extname, basename, dirname, relative } from "node:path";
import sharp from "sharp";

const RAW_DIR = "public/raw_assets";
const ASSETS_DIR = "public/assets";
const IMAGE_EXTS = new Set([".webp", ".jpg", ".jpeg", ".png"]);
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

function outputPath(rawFile: string, rawRoot: string, assetsRoot: string): string {
    const rel = relative(rawRoot, rawFile);
    const base = basename(rel, extname(rel));
    const dir = dirname(rel);
    return join(assetsRoot, dir === "." ? "" : dir, `${base}.webp`);
}

async function processFile(rawFile: string, rawRoot: string, assetsRoot: string) {
    const ext = extname(rawFile).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) return;

    const outFile = outputPath(rawFile, rawRoot, assetsRoot);
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

async function main() {
    const root = process.cwd();
    const rawRoot = join(root, RAW_DIR);
    const assetsRoot = join(root, ASSETS_DIR);

    const files = await walk(rawRoot);
    for (const f of files) {
        await processFile(f, rawRoot, assetsRoot);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
