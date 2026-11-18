begin;

create table public.pilot_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  recruiter_id uuid not null references auth.users(id),
  published boolean not null default false
);

create table public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.pilot_jobs(id),
  candidate_id uuid not null default auth.uid() references auth.users(id),
  answer text not null check (char_length(btrim(answer)) between 20 and 3000),
  submitted_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

alter table public.pilot_jobs enable row level security;
alter table public.pilot_applications enable row level security;

revoke all on public.pilot_jobs, public.pilot_applications from public, anon, authenticated;
grant select on public.pilot_jobs to authenticated;
grant select on public.pilot_applications to authenticated;
grant insert (job_id, answer) on public.pilot_applications to authenticated;

create policy pilot_jobs_read on public.pilot_jobs
  for select to authenticated
  using (published or recruiter_id = (select auth.uid()));

create policy pilot_applications_read on public.pilot_applications
  for select to authenticated
  using (
    candidate_id = (select auth.uid())
    or exists (
      select 1 from public.pilot_jobs job
      where job.id = job_id and job.recruiter_id = (select auth.uid())
    )
  );

create policy pilot_applications_submit on public.pilot_applications
  for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and exists (
      select 1 from public.pilot_jobs job
      where job.id = job_id and job.published and job.recruiter_id <> (select auth.uid())
    )
  );

commit;
