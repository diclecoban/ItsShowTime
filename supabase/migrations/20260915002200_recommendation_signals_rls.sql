drop policy if exists "Users manage own recommendation signals" on public.user_recommendation_signals;
create policy "Users manage own recommendation signals"
on public.user_recommendation_signals
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
