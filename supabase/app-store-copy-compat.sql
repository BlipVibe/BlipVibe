-- App Store copy compatibility (Nov 17 2026). Applied live in the Supabase SQL editor.
-- The native apps' built-in web copy (1.0.3, July 2026) crashes during startup when the equipped skin is one it has
-- never heard of (the newer full skins: scrapbook, good-witch, superhero, basic, ...). It checked for live updates only
-- after startup, so a phone that fell back to it (reinstall, rollback) could never update. Current code reads
-- get_own_profile_v2; the July copy reads get_own_profile, which now hides an unknown equipped skin (the saved skin is
-- untouched; guard_stale_look_writes keeps it when that copy saves). preserve_new_skin_keys keeps keys the July copy
-- doesn't know about when it saves a whole skin_data.

create or replace function public.get_own_profile_v2()
returns jsonb language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare result jsonb;
begin
  select to_jsonb(p) into result from public.profiles p where p.id = auth.uid();
  return result;
end; $$;
revoke all on function public.get_own_profile_v2() from public, anon;
grant execute on function public.get_own_profile_v2() to authenticated;

create or replace function public.get_own_profile()
returns jsonb language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare result jsonb; s text;
begin
  select to_jsonb(p) into result from public.profiles p where p.id = auth.uid();
  s := result->'skin_data'->>'activePremiumSkin';
  -- premium skin ids the July 2026 app copy knows (its premiumSkins list)
  if s is not null and not (s = any(array['witchcraft','anime-blaze','kawaii-cats','geo-prism','dark-prism',
      'autumn-leaves','neon-wave','sakura','galaxy','ocean-tide','molten-gold','toxic-green','vaporwave','blood-moon',
      'cotton-candy','matrix','pastel-aurora','deep-wave','heavens-light'])) then
    result := jsonb_set(result, '{skin_data}', (result->'skin_data') - 'activePremiumSkin');
  end if;
  return result;
end; $$;

create or replace function public.preserve_new_skin_keys()
returns trigger language plpgsql set search_path to 'public', 'pg_temp' as $$
declare k text;
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if old.skin_data is null or new.skin_data is null or new.skin_data is not distinct from old.skin_data then return new; end if;
  foreach k in array array['fsPhotoPos'] loop
    if (old.skin_data ? k) and not (new.skin_data ? k) then
      new.skin_data := jsonb_set(new.skin_data, array[k], old.skin_data->k, true);
    end if;
  end loop;
  return new;
end; $$;
drop trigger if exists preserve_new_skin_keys_trg on public.profiles;
create trigger preserve_new_skin_keys_trg before update on public.profiles
  for each row execute function public.preserve_new_skin_keys();
