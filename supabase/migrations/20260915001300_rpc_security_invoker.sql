-- User-facing aggregate RPCs should still respect table-level RLS.

alter function public.get_profile_stats(uuid) security invoker;
alter function public.get_library_progress(uuid) security invoker;
