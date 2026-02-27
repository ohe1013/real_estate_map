-- Enforce note uniqueness for upsert paths.
-- 1) Remove duplicate rows while keeping the latest row per key.
-- 2) Add unique constraints required by note save paths.

begin;

-- Normalize legacy rows: unit-level notes should not carry place_id.
update public.notes
set place_id = null
where unit_id is not null
  and place_id is not null;

-- Keep the latest place-level note per (user_id, place_id)
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, place_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.notes
  where place_id is not null
    and unit_id is null
)
delete from public.notes n
using ranked r
where n.id = r.id
  and r.rn > 1;

-- Keep the latest unit-level note per (user_id, unit_id)
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, unit_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.notes
  where unit_id is not null
)
delete from public.notes n
using ranked r
where n.id = r.id
  and r.rn > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notes_user_id_place_id_key'
      and conrelid = 'public.notes'::regclass
  ) then
    alter table public.notes
      add constraint notes_user_id_place_id_key unique (user_id, place_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'notes_user_id_unit_id_key'
      and conrelid = 'public.notes'::regclass
  ) then
    alter table public.notes
      add constraint notes_user_id_unit_id_key unique (user_id, unit_id);
  end if;
end $$;

commit;
