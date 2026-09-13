const tvmazeBaseUrl = 'https://api.tvmaze.com';

export type TvmazeShow = {
  id: number;
  name: string;
  summary: string | null;
  image: { medium: string; original: string } | null;
  status: string;
  premiered: string | null;
  rating: { average: number | null };
};

export type TvmazeEpisode = {
  id: number;
  season: number;
  number: number;
  name: string;
  summary: string | null;
  airdate: string | null;
  runtime: number | null;
  rating: { average: number | null };
};

export async function searchTvmazeShows(query: string) {
  const term = query.trim();
  if (!term) return [];

  const response = await fetch(`${tvmazeBaseUrl}/search/shows?q=${encodeURIComponent(term)}`);
  if (!response.ok) throw new Error(`TVmaze request failed: ${response.status}`);

  const data = (await response.json()) as Array<{ show: TvmazeShow }>;
  return data.map((item) => item.show);
}

export async function getTvmazeEpisodes(showId: number) {
  const response = await fetch(`${tvmazeBaseUrl}/shows/${showId}/episodes`);
  if (!response.ok) throw new Error(`TVmaze episodes request failed: ${response.status}`);

  return (await response.json()) as TvmazeEpisode[];
}
