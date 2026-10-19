# ResumePilot

ResumePilot is a focused workspace for building role-specific resumes. It gives users one master career profile, reusable resume drafts, job-description keyword matching, an ATS readiness check, and a print-ready resume preview.

## Latest update

- Six original print-ready templates: Modern, Professional, Minimal, Executive, Sidebar, and Creative.
- A browser-local workspace option for development when Supabase cannot be reached locally. It is never available in production builds.
- Three spacing modes and six accent-color choices for every template.

## What works today

- Supabase authentication with email code sign-in, password sign-in, account recovery, and protected dashboard routes.
- A complete master profile: contact details, summary, skills, education, experience, projects, certifications, and achievements.
- Resume creation, editing, saved history, tailored job descriptions, templates, layouts, and accent colors.
- ATS and job-match analysis based on the actual saved resume data.
- Print / Save PDF from the live resume preview.
- Account basics and skills sync to Supabase; full resume drafts remain in browser storage by design for now.

## Local setup

1. Install dependencies with `npm install`.
2. Create `.env.local` with:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

The Supabase project should provide `profiles` and `profile_skills` tables with policies that permit a user to access only their own rows. The application remains usable for local resume drafting if profile syncing is unavailable.

## Deploy to Vercel

1. Push the `frontend` folder to a Git repository, or use it as the repository root.
2. In Vercel, select **Add New → Project** and import the repository.
3. If the repository contains this workspace structure, set **Root Directory** to `frontend`.
4. Add these environment variables for Production, Preview, and Development:

   ```text
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   ```

5. Deploy. Vercel will run `npm run build` automatically.

Before sharing the public URL, restore the Supabase project and configure the Auth redirect URLs for your Vercel domain:

```text
https://your-domain.vercel.app/auth/callback
https://your-domain.vercel.app/reset-password
```

Use Node.js 20.9 or later in other hosting providers. Copy `.env.example` to `.env.local` for local setup. Resume drafts are browser-local today, so they will not yet sync across devices.

## Quality checks

```bash
npm run lint
npm run build
```

## Next product step

Move saved resume drafts and the extended profile sections to Supabase with row-level security, then add document import/export storage. That will make a user’s complete workspace available across devices.
