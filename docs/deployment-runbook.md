# FlowLog Deployment Runbook

## Stack

- Vercel for hosting and custom domain
- Supabase for Auth and Postgres
- Email OTP for sign-in

## 1. Create the Supabase project

1. Create a new Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](/Users/evan/Code/Projects/FlowLog/supabase/schema.sql).
   - The file is safe to re-run on an existing project. It recreates the app's RLS policies and uses additive schema updates for older databases.
   - The schema also adds `tasks` and `dashboard_settings` to the `supabase_realtime` publication so open sessions receive live updates.
3. In Authentication settings:
   - enable email auth
   - keep public signup enabled if you want first-time emails to create accounts automatically
   - update the email template to show `{{ .Token }}` instead of `{{ .ConfirmationURL }}`
4. Copy the project URL and anon public key.

## 2. Configure local development

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Deploy to Vercel

1. Import the Git repository into Vercel.
2. Add the same environment variables in the Vercel project settings.
3. Deploy the app.
4. Confirm OTP login works on the default `*.vercel.app` URL first.

## 4. Connect the custom domain

1. In Vercel, add the custom domain to the project.
2. Update DNS at the registrar with the records Vercel provides.
3. Once the domain resolves, update Supabase Auth settings:
   - Site URL: `https://your-domain`

## 5. Verify production

- Sign in with an email verification code.
- Create tasks and refresh.
- Sign out and sign back in.
- Verify the same account sees the same tasks across devices.
- Keep the app open on two devices, edit one, and confirm the other updates without a manual reload.

## 6. Updating an Existing Supabase Project

If your database was created from an older version of FlowLog:

1. Open the Supabase SQL editor.
2. Re-run [`supabase/schema.sql`](/Users/evan/Code/Projects/FlowLog/supabase/schema.sql).
3. Confirm the `public.tasks` table includes newer additive columns such as `estimated_minutes`, `elapsed_seconds`, and `current_session_started_at`.
4. Confirm `public.tasks` and `public.dashboard_settings` are part of the `supabase_realtime` publication.
5. Confirm authenticated users can still read and write their own dashboard data after the update.
