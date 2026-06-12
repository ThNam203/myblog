"use client";

import { useEffect, useRef, useState } from "react";
import { MUSIC_TRACKS } from "@/lib/music-tracks";

export type MusicValue = { src: string; startTime: number };

type Props = {
    value: MusicValue | null;
    onChange: (value: MusicValue | null) => void;
};

/**
 * Song dropdown + start-time preview. Play seeks the track to `startTime`
 * first, exactly like the story viewer does.
 */
export function MusicPicker({ value, onChange }: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Stop playback when the track changes or the picker unmounts.
    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            audio?.pause();
            setIsPlaying(false);
        };
    }, [value?.src]);

    function setStartTime(startTime: number) {
        if (!value) return;
        onChange({ ...value, startTime });
        const audio = audioRef.current;
        if (audio && !audio.paused) audio.currentTime = startTime;
    }

    function togglePreview() {
        const audio = audioRef.current;
        if (!audio || !value) return;
        if (audio.paused) {
            audio.currentTime = value.startTime;
            void audio.play();
            setIsPlaying(true);
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <select
                className="rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                value={value?.src ?? ""}
                onChange={(e) => {
                    const src = e.target.value;
                    onChange(src ? { src, startTime: 0 } : null);
                }}
            >
                <option value="">No music</option>
                {MUSIC_TRACKS.map((track) => (
                    <option key={track.src} value={track.src}>
                        {track.title} — {track.artist}
                    </option>
                ))}
            </select>

            {value && (
                <div className="flex items-center gap-2 text-sm">
                    <audio
                        ref={audioRef}
                        src={value.src}
                        preload="metadata"
                        onLoadedMetadata={(e) => setDuration(Math.floor(e.currentTarget.duration))}
                        onEnded={() => setIsPlaying(false)}
                    />
                    <button
                        type="button"
                        onClick={togglePreview}
                        className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700"
                        aria-label={isPlaying ? "Pause preview" : "Preview from start time"}
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        step={1}
                        value={Math.min(value.startTime, duration || value.startTime)}
                        onChange={(e) => setStartTime(Number(e.target.value))}
                        className="flex-1"
                    />
                    <input
                        type="number"
                        min={0}
                        max={duration || undefined}
                        value={value.startTime}
                        onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
                        className="w-16 rounded border border-neutral-300 bg-transparent px-1 py-0.5 dark:border-neutral-700"
                    />
                    <span className="text-neutral-500">
                        s{duration ? ` / ${duration}s` : ""}
                    </span>
                </div>
            )}
        </div>
    );
}
