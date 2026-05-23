import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ooqgdbrqwimsqekndyrp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcWdkYnJxd2ltc3Fla25keXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQ0MTEsImV4cCI6MjA5NTA5MDQxMX0.M6QCnQ92xJkbgTuB5w3PQBsjvVFekIrOe-3z7n2T1tI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
