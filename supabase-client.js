/* =========================================================================
   RiGiD — Shared Supabase Client

   This file is shared by:
   - Login
   - Dashboard
   - Personal Dashboard
   - Admin features
   - Future modules
   ========================================================================= */

const SUPABASE_URL =
  "https://mmmsmncmskvuqyhaqcne.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbXNtbmNtc2t2dXF5aGFxY25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDI4ODYsImV4cCI6MjEwMjIxODg4Nn0.9BouagZcXChEmH1nBq0kMjgSse4kzEwb4Aji38JDWxU";

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );