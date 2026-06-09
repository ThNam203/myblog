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
