# FlowLog Deployment Runbook

## Stack

- Vercel for hosting and custom domain
- Supabase for Auth and Postgres
- Email magic link for sign-in

## 1. Create the Supabase project

1. Create a new Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](/Users/evan/Code/Projects/FlowLog/supabase/schema.sql).
3. In Authentication settings:
   - enable email auth
   - enable magic links
   - set the site URL to your production domain later
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
4. Confirm login works on the default `*.vercel.app` URL first.

## 4. Connect the custom domain

1. In Vercel, add the custom domain to the project.
2. Update DNS at the registrar with the records Vercel provides.
3. Once the domain resolves, update Supabase Auth settings:
   - Site URL: `https://your-domain`
   - Redirect URL: `https://your-domain/auth/callback`

## 5. Verify production

- Sign in with a magic link.
- Create tasks and refresh.
- Sign out and sign back in.
- Verify the same account sees the same tasks across devices.
