begin;
select set_config('task.candidate', (select id::text from auth.users where id not in(select user_id from public.employer_accounts) limit 1),true);
select set_config('request.jwt.claim.sub',(select user_id::text from public.employer_accounts limit 1),true);
set local role authenticated;
insert into public.employer_offers(id,data) values ('2da709a3-09e3-4777-9294-d06a48e5e3f2','{"id":"2da709a3-09e3-4777-9294-d06a48e5e3f2","slug":"cloud-test","companyId":"supabase-employer","title":"Oferta testowa zapisu w bazie","summary":"Syntetyczne podsumowanie testowe.","description":"Syntetyczna oferta służąca wyłącznie do sprawdzenia zapisu w bazie.","sourceBrief":"Syntetyczny brief","generatedDescription":"Syntetyczna propozycja","category":"lead","function":"product","remoteStatus":"remote","locations":["Poznań"],"seniority":"senior","contract":"b2b","salaryMin":12000,"salaryMax":15000,"salaryCurrency":"PLN","salaryPeriod":"month","salaryKind":"gross","publicationStatus":"draft","publishedAt":"2026-11-18T21:00:00.000Z","expiryAt":"2099-12-31T23:59:59.000Z","verificationStatus":"unverified","escoProfile":{"uri":"http://data.europa.eu/esco/occupation/e5a63940-57d3-4065-8713-74b4e2c93063","label":"Profil testowy","description":"Opis testowy.","language":"pl","skills":[{"uri":"http://data.europa.eu/esco/skill/91abe492-18be-4cce-93c7-0dca07072363","label":"Umiejętność testowa","essential":true}]}}'::jsonb);
do $$ begin
 if (select count(*) from public.employer_offers where id='2da709a3-09e3-4777-9294-d06a48e5e3f2' and data->'escoProfile'->'skills'->0->>'label'='Umiejętność testowa' and data->>'sourceBrief'='Syntetyczny brief') <> 1 then raise exception 'owner round trip failed'; end if;
 begin update public.employer_offers set owner_id=current_setting('task.candidate')::uuid where id='2da709a3-09e3-4777-9294-d06a48e5e3f2'; raise exception 'owner change unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
update public.employer_offers set data=jsonb_set(data,'{title}','"Zmieniona oferta testowa"') where id='2da709a3-09e3-4777-9294-d06a48e5e3f2' and revision=1;
do $$ declare n int; begin
 if (select revision from public.employer_offers where id='2da709a3-09e3-4777-9294-d06a48e5e3f2') <> 2 then raise exception 'revision failed'; end if;
 update public.employer_offers set data=jsonb_set(data,'{title}','"Stara wersja"') where id='2da709a3-09e3-4777-9294-d06a48e5e3f2' and revision=1; get diagnostics n=row_count;
 if n <> 0 then raise exception 'stale update unexpectedly allowed'; end if;
 begin update public.employer_offers set data='{}'::jsonb where id='2da709a3-09e3-4777-9294-d06a48e5e3f2'; raise exception 'invalid schema unexpectedly allowed'; exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('task.candidate'),true);
do $$ declare n int; begin
 if (select count(*) from public.employer_offers) <> 0 then raise exception 'candidate can read offers'; end if;
 if (select count(*) from public.employer_accounts) <> 0 then raise exception 'candidate can read memberships'; end if;
 begin insert into public.employer_accounts(user_id) values(auth.uid()); raise exception 'candidate can self promote'; exception when insufficient_privilege then null; end;
 begin insert into public.employer_offers(id,data) values ('2da709a3-09e3-4777-9294-d06a48e5e3f2','{"id":"2da709a3-09e3-4777-9294-d06a48e5e3f2","slug":"cloud-test","companyId":"supabase-employer","title":"Oferta testowa zapisu w bazie","summary":"Syntetyczne podsumowanie testowe.","description":"Syntetyczna oferta służąca wyłącznie do sprawdzenia zapisu w bazie.","sourceBrief":"Syntetyczny brief","generatedDescription":"Syntetyczna propozycja","category":"lead","function":"product","remoteStatus":"remote","locations":["Poznań"],"seniority":"senior","contract":"b2b","salaryMin":12000,"salaryMax":15000,"salaryCurrency":"PLN","salaryPeriod":"month","salaryKind":"gross","publicationStatus":"draft","publishedAt":"2026-11-18T21:00:00.000Z","expiryAt":"2099-12-31T23:59:59.000Z","verificationStatus":"unverified","escoProfile":{"uri":"http://data.europa.eu/esco/occupation/e5a63940-57d3-4065-8713-74b4e2c93063","label":"Profil testowy","description":"Opis testowy.","language":"pl","skills":[{"uri":"http://data.europa.eu/esco/skill/91abe492-18be-4cce-93c7-0dca07072363","label":"Umiejętność testowa","essential":true}]}}'::jsonb); raise exception 'candidate can write'; exception when insufficient_privilege then null; end;
 update public.employer_offers set data=jsonb_set(data,'{title}','"Candidate edit"') where id='2da709a3-09e3-4777-9294-d06a48e5e3f2';get diagnostics n=row_count;
 if n <> 0 then raise exception 'candidate can edit another owner'; end if;
end $$;
reset role;
insert into public.employer_accounts(user_id) values(current_setting('task.candidate')::uuid);
set local role authenticated;
do $$ declare n int; begin
 if (select count(*) from public.employer_offers) <> 0 then raise exception 'unrelated employer can read'; end if;
 update public.employer_offers set data=jsonb_set(data,'{title}','"Other employer edit"') where id='2da709a3-09e3-4777-9294-d06a48e5e3f2';get diagnostics n=row_count;
 if n <> 0 then raise exception 'unrelated employer can edit'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.employer_offers; raise exception 'anon can read'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'passed: full payload and ESCO round trip; owner update; stale revision protection; schema validation; owner immutability; candidate/anonymous/unrelated employer isolation; self-promotion denied. All synthetic changes rolled back.' as checks;
