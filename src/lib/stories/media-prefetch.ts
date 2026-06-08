// Browser-only helpers that warm the HTTP cache for upcoming story media, so
// the next image/track is ready before the viewer switches to it. No-ops on the
// server. A module-level set dedups, so each URL is fetched at most once.

const prefetched = new Set<string>();

function claim(src: string): boolean {
    if (!src || typeof window === "undefined" || prefetched.has(src)) return false;
    prefetched.add(src);
    return true;
}

export function prefetchImage(src: string): void {
    if (!claim(src)) return;
    const img = new Image();
    img.src = src;
}

export function prefetchAudio(src: string): void {
    if (!claim(src)) return;
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = src;
    audio.load();
}
