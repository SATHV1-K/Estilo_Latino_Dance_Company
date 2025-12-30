import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

if (!supabaseAnonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Service role client - bypasses RLS, use for server-side operations
export const supabaseAdmin: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Anon client - respects RLS, can be used for client-facing operations
export const supabaseAnon: SupabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey
);

// Helper to get storage bucket
export const STORAGE_BUCKETS = {
    WAIVERS: 'waivers',
    SIGNATURES: 'signatures',
} as const;

// Initialize storage buckets if they don't exist
export async function initializeStorage(): Promise<void> {
    for (const bucket of Object.values(STORAGE_BUCKETS)) {
        const { error } = await supabaseAdmin.storage.createBucket(bucket, {
            public: false,
            fileSizeLimit: 10485760, // 10MB
        });

        if (error && !error.message.includes('already exists')) {
            console.error(`Error creating bucket ${bucket}:`, error);
        }
    }
}

export default supabaseAdmin;
