-- Run once to allow signed-in users to import free TVmaze show metadata into the shared catalog.

drop policy if exists "Authenticated users can import shows" on public.shows;
create policy "Authenticated users can import shows"
on public.shows
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update imported shows" on public.shows;
create policy "Authenticated users can update imported shows"
on public.shows
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can import seasons" on public.seasons;
create policy "Authenticated users can import seasons"
on public.seasons
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update imported seasons" on public.seasons;
create policy "Authenticated users can update imported seasons"
on public.seasons
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can import episodes" on public.episodes;
create policy "Authenticated users can import episodes"
on public.episodes
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update imported episodes" on public.episodes;
create policy "Authenticated users can update imported episodes"
on public.episodes
for update
to authenticated
using (true)
with check (true);
