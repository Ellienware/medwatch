# Troubleshooting Guide

Common issues and solutions for MedSurv.

## Database & Supabase Issues

### Issue: "relation does not exist" errors

**Cause:** Database tables haven't been created yet.

**Solution:**
1. Open Supabase dashboard → SQL Editor
2. Run scripts in order:
   - `scripts/001_initial_schema.sql`
   - `scripts/002_row_level_security.sql`
   - `scripts/003_seed_data_v2.sql` (use v2, not the original)

### Issue: "Row Level Security policy violation"

**Cause:** User doesn't have permission to access data, or RLS policies aren't set up correctly.

**Solution:**
1. Verify RLS policies are enabled: Check `scripts/002_row_level_security.sql`
2. Check user has correct `clinic_id` in their profile
3. Verify user's `role` matches expected permissions
4. For testing, you can temporarily disable RLS on specific tables (NOT recommended for production)

### Issue: User profile not created after signup

**Cause:** Error in the signup flow or database trigger failure.

**Solution:**
1. Check Supabase logs for errors
2. Manually verify user exists in `auth.users` table
3. Check if corresponding entry exists in `users` table
4. If missing, manually insert user profile:
\`\`\`sql
INSERT INTO users (auth_user_id, email, full_name, role, is_active)
VALUES ('auth_user_uuid', 'email@example.com', 'Full Name', 'clinic_admin', true);
\`\`\`

### Issue: Foreign key constraint violation on clinical_tests

**Cause:** Trying to insert clinical tests before creating a clinic (error with `003_seed_data.sql`).

**Solution:**
1. Use `scripts/003_seed_data_v2.sql` instead
2. This version creates a demo clinic first with ID `00000000-0000-0000-0000-000000000001`
3. Then inserts clinical tests linked to that clinic
4. If you already ran the old script, clear the clinical_tests table:
\`\`\`sql
DELETE FROM clinical_tests WHERE clinic_id = '00000000-0000-0000-0000-000000000000';
\`\`\`
5. Then run the v2 script

## Authentication Issues

### Issue: Infinite redirect loop on login

**Cause:** Middleware configuration or role-based redirect logic issues.

**Solution:**
1. Check `proxy.ts` middleware configuration
2. Verify user has a valid `role` in the database
3. Check browser console for errors
4. Clear browser cookies and try again

### Issue: "Invalid login credentials"

**Cause:** Wrong email/password or user not verified.

**Solution:**
1. Check Supabase Authentication dashboard for user status
2. Verify email has been confirmed
3. Try password reset flow
4. Check if user's `is_active` flag is `true` in database

### Issue: Email verification not received

**Cause:** Email configuration or development environment issues.

**Solution:**
1. Check Supabase email templates are configured
2. For development, check Supabase dashboard → Authentication → Email Templates
3. Verify `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is set correctly
4. Add `http://localhost:3000/**` to Supabase redirect URLs whitelist

## UI & Display Issues

### Issue: Page shows "Unauthorized" or redirects immediately

**Cause:** User role doesn't match required permissions for that route.

**Solution:**
1. Check user's `role` in database
2. Verify `RoleGate` component has correct `allowedRoles` prop
3. Check `proxy.ts` for route protection logic
4. Ensure user is logged in with correct credentials

### Issue: Tables show "No data found" but data exists

**Cause:** RLS policies blocking access or incorrect clinic_id filtering.

**Solution:**
1. Check browser console for errors
2. Verify user has `clinic_id` set correctly
3. Check RLS policies allow user's role to view data
4. Test query directly in Supabase SQL Editor with user's context

### Issue: Forms not submitting or showing errors

**Cause:** Client-side validation, missing fields, or server action errors.

**Solution:**
1. Check browser console for JavaScript errors
2. Verify all required fields are filled
3. Check network tab for failed API calls
4. Review server-side validation in server actions

## Performance Issues

### Issue: Slow page loads

**Cause:** Large data queries, missing indexes, or N+1 query problems.

**Solution:**
1. Check database indexes exist (see `scripts/001_initial_schema.sql`)
2. Review queries for unnecessary joins or missing `limit` clauses
3. Use Supabase query performance analyzer
4. Consider implementing pagination for large datasets

### Issue: Mobile layout broken

**Cause:** Tailwind responsive classes not applied correctly.

**Solution:**
1. Check for missing responsive prefixes (`md:`, `lg:`, etc.)
2. Verify viewport meta tag in `layout.tsx`
3. Test on actual mobile device, not just browser DevTools
4. Check for fixed widths that should be responsive

## Development Issues

### Issue: "Module not found" errors

**Cause:** Missing dependencies or incorrect import paths.

**Solution:**
\`\`\`bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or if using pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
\`\`\`

### Issue: TypeScript errors

**Cause:** Type mismatches or missing type definitions.

**Solution:**
1. Check `lib/types/database.ts` matches your database schema
2. Run `npm run build` to see all TypeScript errors
3. Update types to match actual database structure
4. Restart TypeScript server in VS Code: `Cmd+Shift+P` → "Restart TS Server"

### Issue: Environment variables not working

**Cause:** `.env.local` file not loaded or incorrect variable names.

**Solution:**
1. Verify `.env.local` exists in project root
2. Check variable names match exactly (case-sensitive)
3. Restart development server after changing env vars
4. For client-side vars, ensure they start with `NEXT_PUBLIC_`

## Deployment Issues

### Issue: Build fails on Vercel

**Cause:** TypeScript errors, missing env vars, or build configuration issues.

**Solution:**
1. Test build locally: `npm run build`
2. Add all required env vars in Vercel dashboard
3. Check build logs for specific errors
4. Verify Next.js version compatibility

### Issue: Production database connection fails

**Cause:** Wrong credentials or connection pooling issues.

**Solution:**
1. Verify production Supabase credentials in Vercel env vars
2. Use `POSTGRES_URL` for connection pooling if needed
3. Check Supabase project is not paused
4. Verify database is in same region as Vercel deployment for best performance

## Getting Help

If none of these solutions work:

1. Check browser console for detailed error messages
2. Review Supabase logs in dashboard
3. Check Next.js server logs (terminal or Vercel logs)
4. Verify all SQL scripts have been executed successfully
5. Create a GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment (local/production)
   - Screenshots if applicable
