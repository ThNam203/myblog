#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { argv, exit, cwd } from "node:process";

type Locale = "vi" | "en";
const LOCALES: Locale[] = ["vi", "en"];

function slugify(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function nextOrdinal(localeDir: string): number {
    if (!existsSync(localeDir)) return 1;
    const max = readdirSync(localeDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => {
            const match = name.match(/^(\d+)\./);
            return match ? Number(match[1]) : 0;
        })
        .reduce((acc, value) => Math.max(acc, value), 0);
    return max + 1;
}

function parseArgs(): { title: string; draft: boolean; categories: string[] } {
    const args = argv.slice(2);
    let title = "";
    let draft = false;
    const categories: string[] = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--draft") {
            draft = true;
        } else if (arg === "--category" || arg === "-c") {
            const next = args[++i];
            if (next) categories.push(next);
        } else if (!title) {
            title = arg;
        }
    }
    if (!title) {
        console.error("Usage: npm run new-post -- \"My post title\" -c category [-c category]... [--draft]");
        exit(1);
    }
    if (categories.length === 0) {
        console.error("At least one category is required: -c <name>");
        exit(1);
    }
    return { title, draft, categories };
}

function yamlEscape(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function template(opts: {
    title: string;
    excerpt: string;
    date: string;
    categories: string[];
    draft: boolean;
}): string {
    const categoryYaml = opts.categories.map((c) => `    - ${yamlEscape(c)}`).join("\n");
    return `---
title: "${yamlEscape(opts.title)}"
excerpt: "${yamlEscape(opts.excerpt)}"
date: "${opts.date}"
categories:
${categoryYaml}
author:
    name: Huỳnh Thành Nam
    picture: "/assets/avatar/my_second_avatar.webp"
${opts.draft ? "draft: true\n" : ""}---

Write your post here.
`;
}

function main() {
    const { title, draft, categories } = parseArgs();
    const slug = slugify(title);
    if (!slug) {
        console.error("Could not derive slug from title.");
        exit(1);
    }

    const date = new Date().toISOString();
    const excerpt = title;
    const projectRoot = cwd();

    for (const locale of LOCALES) {
        const dir = join(projectRoot, "_posts", locale);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const ordinal = nextOrdinal(dir);
        const fileName = `${ordinal}.${slug}.md`;
        const fullPath = join(dir, fileName);
        if (existsSync(fullPath)) {
            console.error(`Already exists: ${fullPath}`);
            exit(1);
        }
        writeFileSync(
            fullPath,
            template({ title, excerpt, date, categories, draft }),
            "utf8",
        );
        console.log(`Created ${fullPath}`);
    }
}

main();
