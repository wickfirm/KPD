-- Adds the Contributor and Viewer roles. Run once in the Supabase SQL Editor
-- (project kpd-mena) BEFORE assigning either role to anyone. Safe to re-run.
-- Existing accounts keep their current role.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CONTRIBUTOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VIEWER';
