begin;

create extension if not exists pg_jsonschema with schema extensions;

create table public.employer_accounts (
  user_id uuid primary key references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.employer_accounts enable row level security;
revoke all on public.employer_accounts from public, anon, authenticated;
grant select on public.employer_accounts to authenticated;
create policy employer_accounts_read_self on public.employer_accounts
  for select to authenticated using (user_id = (select auth.uid()));

-- Preserve the already assigned pilot recruiters; candidates cannot enrol themselves.
insert into public.employer_accounts (user_id)
select distinct recruiter_id from public.pilot_jobs
on conflict do nothing;

create table public.employer_offers (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  data jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default clock_timestamp(),
  constraint employer_offer_size check (octet_length(data::text) <= 200000),
  constraint employer_offer_id check ((data->>'id') = id::text),
  constraint employer_offer_salary check (
    not (data ? 'salaryMin' and data ? 'salaryMax')
    or (data->>'salaryMin')::numeric <= (data->>'salaryMax')::numeric
  ),
  constraint employer_offer_schema check (extensions.jsonb_matches_schema(
    $schema${
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
    },
    "slug": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "pattern": "^[a-zA-Z0-9][a-zA-Z0-9_-]*$"
    },
    "companyId": {
      "type": "string",
      "const": "supabase-employer"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "summary": {
      "type": "string",
      "minLength": 10,
      "maxLength": 12000
    },
    "description": {
      "type": "string",
      "minLength": 30,
      "maxLength": 12000
    },
    "category": {
      "type": "string",
      "enum": [
        "build",
        "apply",
        "lead"
      ]
    },
    "function": {
      "type": "string",
      "enum": [
        "product",
        "engineering",
        "data",
        "design",
        "marketing",
        "operations"
      ]
    },
    "remoteStatus": {
      "type": "string",
      "enum": [
        "onsite",
        "hybrid",
        "remote"
      ]
    },
    "locations": {
      "minItems": 1,
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "coordinates": {
      "type": "object",
      "properties": {
        "latitude": {
          "type": "number",
          "minimum": -90,
          "maximum": 90
        },
        "longitude": {
          "type": "number",
          "minimum": -180,
          "maximum": 180
        }
      },
      "required": [
        "latitude",
        "longitude"
      ],
      "additionalProperties": false
    },
    "seniority": {
      "type": "string",
      "enum": [
        "junior",
        "mid",
        "senior",
        "lead"
      ]
    },
    "contract": {
      "type": "string",
      "enum": [
        "employment",
        "b2b",
        "mandate"
      ]
    },
    "salaryMin": {
      "type": "number",
      "minimum": 0
    },
    "salaryMax": {
      "type": "number",
      "minimum": 0
    },
    "salaryCurrency": {
      "type": "string",
      "enum": [
        "PLN",
        "EUR"
      ]
    },
    "salaryPeriod": {
      "type": "string",
      "enum": [
        "month",
        "year"
      ]
    },
    "salaryKind": {
      "type": "string",
      "enum": [
        "gross",
        "net"
      ]
    },
    "publicationStatus": {
      "type": "string",
      "const": "draft"
    },
    "publishedAt": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "expiryAt": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "verificationStatus": {
      "type": "string",
      "const": "unverified"
    },
    "sourceBrief": {
      "type": "string",
      "maxLength": 12000
    },
    "generatedDescription": {
      "type": "string",
      "maxLength": 12000
    },
    "escoProfile": {
      "type": "object",
      "properties": {
        "uri": {
          "type": "string",
          "pattern": "^http:\\/\\/data\\.europa\\.eu\\/esco\\/occupation\\/[0-9a-f-]{36}$"
        },
        "label": {
          "type": "string",
          "minLength": 1,
          "maxLength": 500
        },
        "description": {
          "type": "string",
          "maxLength": 12000
        },
        "language": {
          "type": "string",
          "const": "pl"
        },
        "skills": {
          "maxItems": 200,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "uri": {
                "type": "string",
                "pattern": "^http:\\/\\/data\\.europa\\.eu\\/esco\\/skill\\/[0-9a-f-]{36}$"
              },
              "label": {
                "type": "string",
                "minLength": 1,
                "maxLength": 500
              },
              "essential": {
                "type": "boolean"
              }
            },
            "required": [
              "uri",
              "label",
              "essential"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "uri",
        "label",
        "description",
        "language",
        "skills"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "slug",
    "companyId",
    "title",
    "summary",
    "description",
    "category",
    "function",
    "remoteStatus",
    "locations",
    "seniority",
    "contract",
    "publicationStatus",
    "publishedAt",
    "expiryAt",
    "verificationStatus"
  ],
  "additionalProperties": false
}$schema$::json, data
  ))
);
create index employer_offers_owner_updated on public.employer_offers (owner_id, updated_at desc);
alter table public.employer_offers enable row level security;
revoke all on public.employer_offers from public, anon, authenticated;
grant select on public.employer_offers to authenticated;
grant insert (id, data) on public.employer_offers to authenticated;
grant update (data) on public.employer_offers to authenticated;

create policy employer_offers_read on public.employer_offers
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.employer_accounts where user_id = (select auth.uid())
    )
  );
create policy employer_offers_insert on public.employer_offers
  for insert to authenticated with check (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.employer_accounts where user_id = (select auth.uid())
    )
  );
create policy employer_offers_update on public.employer_offers
  for update to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.employer_accounts where user_id = (select auth.uid())
    )
  ) with check (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.employer_accounts where user_id = (select auth.uid())
    )
  );

create function public.employer_offer_revision() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.employer_offer_revision() from public, anon, authenticated;
create trigger employer_offer_revision before update on public.employer_offers
for each row execute function public.employer_offer_revision();

comment on table public.employer_offers is 'Private employer drafts; publication and candidate access use separate flows.';
commit;
