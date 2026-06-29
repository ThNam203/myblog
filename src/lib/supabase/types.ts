export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    display_name: string;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    display_name: string;
                    created_at?: string;
                };
                Update: {
                    display_name?: string;
                };
                Relationships: [];
            };
            comments: {
                Row: {
                    id: string;
                    post_slug: string;
                    user_id: string;
                    parent_id: string | null;
                    body: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    post_slug: string;
                    user_id: string;
                    parent_id?: string | null;
                    body: string;
                    created_at?: string;
                };
                Update: Record<string, never>;
                Relationships: [];
            };
            confessions: {
                Row: {
                    id: string;
                    body: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    body: string;
                    created_at?: string;
                };
                Update: {
                    body?: string;
                };
                Relationships: [];
            };
            post_reactions: {
                Row: {
                    id: string;
                    post_slug: string;
                    emoji: string;
                    session_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    post_slug: string;
                    emoji: string;
                    session_id: string;
                    created_at?: string;
                };
                Update: Record<string, never>;
                Relationships: [];
            };
            post_views: {
                Row: {
                    post_slug: string;
                    count: number;
                    updated_at: string;
                };
                Insert: {
                    post_slug: string;
                    count?: number;
                    updated_at?: string;
                };
                Update: {
                    count?: number;
                    updated_at?: string;
                };
                Relationships: [];
            };
            story_groups: {
                Row: {
                    id: string;
                    title: Json;
                    cover: string;
                    items: Json;
                    created_at: string;
                    active_for_ms: number | null;
                };
                Insert: {
                    id: string;
                    title: Json;
                    cover: string;
                    items: Json;
                    created_at?: string;
                    active_for_ms?: number | null;
                };
                Update: {
                    id?: string;
                    title?: Json;
                    cover?: string;
                    items?: Json;
                    created_at?: string;
                    active_for_ms?: number | null;
                };
                Relationships: [];
            };
            badge_series: {
                Row: {
                    id: string;
                    label: Json;
                };
                Insert: {
                    id: string;
                    label: Json;
                };
                Update: {
                    label?: Json;
                };
                Relationships: [];
            };
            badge_definitions: {
                Row: {
                    id: string;
                    series_id: string;
                    order: number;
                    label: Json | null;
                    description: Json;
                    icon: string | null;
                    condition_key: string;
                    threshold: number;
                };
                Insert: {
                    id?: string;
                    series_id: string;
                    order: number;
                    label?: Json | null;
                    description: Json;
                    icon?: string | null;
                    condition_key: string;
                    threshold: number;
                };
                Update: {
                    series_id?: string;
                    order?: number;
                    label?: Json | null;
                    description?: Json;
                    icon?: string | null;
                    condition_key?: string;
                    threshold?: number;
                };
                Relationships: [];
            };
            user_badges: {
                Row: {
                    id: string;
                    user_id: string;
                    badge_definition_id: string;
                    granted_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    badge_definition_id: string;
                    granted_at?: string;
                };
                Update: Record<string, never>;
                Relationships: [];
            };
            user_post_reads: {
                Row: {
                    user_id: string;
                    post_slug: string;
                    read_at: string;
                };
                Insert: {
                    user_id: string;
                    post_slug: string;
                    read_at?: string;
                };
                Update: Record<string, never>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: {
            increment_post_views: {
                Args: { slug: string };
                Returns: undefined;
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

export type Comment = Database["public"]["Tables"]["comments"]["Row"] & {
    profiles: { display_name: string } | null;
};

export type Confession = Database["public"]["Tables"]["confessions"]["Row"];

export type ReactionEmoji = "heart" | "fire" | "cry" | "laugh";

export type ReactionCounts = Record<ReactionEmoji, number>;
export type MyReactions = Record<ReactionEmoji, boolean>;
