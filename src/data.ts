import { Bell, CalendarDays, Medal, MessageCircle, Moon, Tv } from 'lucide-react';

import { accent, gold } from './theme';
import type { CustomList, Episode, LibraryShow, Movie, NotificationItem, SearchResult, ShowSeason, UpcomingGroup } from './types';

export const episodes: Episode[] = [
  {
    id: 1,
    show: 'Severance',
    code: 'S02 | E04',
    title: 'Woe\'s Hollow',
    tag: 'WATCH NEXT',
    progress: 64,
    watchedEpisodes: 6,
    totalEpisodes: 10,
    averageRating: 4.6,
    watched: false,
    image:
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 2,
    show: 'The Bear',
    code: 'S03 | E02',
    title: 'Next',
    tag: 'NEW EPISODE',
    progress: 42,
    watchedEpisodes: 4,
    totalEpisodes: 10,
    averageRating: 4.3,
    watched: false,
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 3,
    show: 'Dark',
    code: 'S01 | E09',
    title: 'Everything Is Now',
    tag: 'CONTINUE',
    progress: 88,
    watchedEpisodes: 7,
    totalEpisodes: 8,
    averageRating: 4.8,
    watched: true,
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop',
  },
];

export const discoveries = [
  {
    title: 'Slow Horses',
    meta: '4 seasons - Apple TV+',
    body: 'A sharp spy thriller climbing fast among people who love messy teams.',
    match: '93% match',
    reason: 'Because you keep coming back to clever workplace chaos.',
    fit: ['45 min', 'Spy', 'Ongoing'],
    image:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'The Studio',
    meta: '1 season - Apple TV+',
    body: 'Industry chaos, prestige anxiety, and a surprisingly warm comedy core.',
    match: '88% match',
    reason: 'Fast dialogue, anxious people, excellent bad decisions.',
    fit: ['30 min', 'Comedy', 'New'],
    image:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'Station Eleven',
    meta: '1 season - Max',
    body: 'A lyrical limited series about art, memory, and starting again.',
    match: '84% match',
    reason: 'For nights when you want something emotional and complete.',
    fit: ['Limited', 'Drama', 'Finished'],
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=900&auto=format&fit=crop',
  },
];

export const showSeasons: Record<string, ShowSeason[]> = {
  Severance: [
    {
      season: 'Season 1',
      episodes: [
        { code: 'E01', title: 'Good News About Hell', watched: true, averageRating: 4.3 },
        { code: 'E02', title: 'Half Loop', watched: true, averageRating: 4.4 },
        { code: 'E03', title: 'In Perpetuity', watched: true, averageRating: 4.5 },
        { code: 'E04', title: 'The You You Are', watched: true, averageRating: 4.6 },
      ],
    },
    {
      season: 'Season 2',
      episodes: [
        { code: 'E01', title: 'Hello, Ms. Cobel', watched: true, averageRating: 4.4 },
        { code: 'E02', title: 'Goodbye, Mrs. Selvig', watched: true, averageRating: 4.5 },
        { code: 'E03', title: 'Who Is Alive?', watched: true, averageRating: 4.7 },
        { code: 'E04', title: 'Woe\'s Hollow', watched: false, averageRating: 4.6 },
      ],
    },
  ],
  'The Bear': [
    {
      season: 'Season 3',
      episodes: [
        { code: 'E01', title: 'Tomorrow', watched: true, averageRating: 4.2 },
        { code: 'E02', title: 'Next', watched: false, averageRating: 4.3 },
        { code: 'E03', title: 'Doors', watched: false, averageRating: 4.1 },
        { code: 'E04', title: 'Violet', watched: false, averageRating: 4.4 },
      ],
    },
  ],
  Dark: [
    {
      season: 'Season 1',
      episodes: [
        { code: 'E01', title: 'Secrets', watched: true, averageRating: 4.5 },
        { code: 'E02', title: 'Lies', watched: true, averageRating: 4.6 },
        { code: 'E03', title: 'Past and Present', watched: true, averageRating: 4.7 },
        { code: 'E04', title: 'Double Lives', watched: true, averageRating: 4.8 },
      ],
    },
  ],
  'Slow Horses': [
    {
      season: 'Season 1',
      episodes: [
        { code: 'E01', title: 'Failure\'s Contagious', watched: false, averageRating: 4.2 },
        { code: 'E02', title: 'Work Drinks', watched: false, averageRating: 4.3 },
        { code: 'E03', title: 'Bad Tradecraft', watched: false, averageRating: 4.4 },
      ],
    },
  ],
  'Station Eleven': [
    {
      season: 'Limited Series',
      episodes: [
        { code: 'E01', title: 'Wheel of Fire', watched: false, averageRating: 4.5 },
        { code: 'E02', title: 'A Hawk from a Handsaw', watched: false, averageRating: 4.4 },
        { code: 'E03', title: 'Hurricane', watched: false, averageRating: 4.6 },
      ],
    },
  ],
};

export const favoriteShows = [
  {
    title: 'Severance',
    image:
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'The Bear',
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Dark',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Station Eleven',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=600&auto=format&fit=crop',
  },
];

export const achievements = [
  { title: 'Pilot Hunter', icon: Tv, tone: accent },
  { title: 'Night Owl', icon: Moon, tone: gold },
  { title: 'No Spoilers', icon: Medal, tone: '#f4f5ef' },
];

export const searchResults: SearchResult[] = [
  {
    title: 'Severance',
    meta: '2 seasons - Drama - Apple TV+',
    platform: 'Apple TV+',
    status: 'In library',
    type: 'Shows',
    image:
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Slow Horses',
    meta: '4 seasons - Spy - Apple TV+',
    platform: 'Apple TV+',
    status: 'Add',
    type: 'Shows',
    image:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Station Eleven',
    meta: 'Limited series - Drama - Max',
    platform: 'Max',
    status: 'Add',
    type: 'Shows',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Arrival',
    meta: 'Movie - Sci-fi - Netflix',
    platform: 'Netflix',
    status: 'Add',
    type: 'Movies',
    image:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Adam Scott',
    meta: 'Actor - Severance, Parks and Recreation',
    platform: '',
    status: 'Add',
    type: 'People',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop',
  },
];

export const upcomingGroups: UpcomingGroup[] = [
  {
    day: 'Today',
    date: 'Sep 12',
    items: [
      {
        show: 'The Bear',
        code: 'S03 | E05',
        title: 'Children',
        time: '9:00 PM',
        platform: 'Hulu',
        tracked: true,
        image:
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
  {
    day: 'Tomorrow',
    date: 'Sep 13',
    items: [
      {
        show: 'Slow Horses',
        code: 'S04 | E02',
        title: 'A Stranger Comes to Town',
        time: '3:00 AM',
        platform: 'Apple TV+',
        tracked: false,
        image:
          'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      },
      {
        show: 'Only Murders',
        code: 'S05 | E01',
        title: 'Season Premiere',
        time: '8:00 AM',
        platform: 'Hulu',
        tracked: true,
        image:
          'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
  {
    day: 'Friday',
    date: 'Sep 18',
    items: [
      {
        show: 'Severance',
        code: 'S02 | E05',
        title: 'Trojan\'s Horse',
        time: '12:00 AM',
        platform: 'Apple TV+',
        tracked: true,
        image:
          'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
];

export const libraryShows: LibraryShow[] = [
  {
    title: 'Severance',
    status: 'Watching',
    progress: 64,
    watchedEpisodes: 6,
    totalEpisodes: 10,
    next: 'S02 | E04',
    meta: '6 of 10 watched',
    image:
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Dark',
    status: 'Finished',
    progress: 100,
    watchedEpisodes: 26,
    totalEpisodes: 26,
    next: 'Complete',
    meta: '26 of 26 watched',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'The Bear',
    status: 'Watching',
    progress: 42,
    watchedEpisodes: 4,
    totalEpisodes: 10,
    next: 'S03 | E02',
    meta: '4 of 10 watched',
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=600&auto=format&fit=crop',
  },
  {
    title: 'Mindhunter',
    status: 'Paused',
    progress: 58,
    watchedEpisodes: 11,
    totalEpisodes: 19,
    next: 'S02 | E06',
    meta: '11 of 19 watched',
    image:
      'https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=600&auto=format&fit=crop',
  },
];

export const movies: Movie[] = [
  {
    id: 1,
    title: 'Arrival',
    year: '2016',
    runtime: '116 min',
    platform: 'Paramount+',
    genre: 'Sci-fi',
    status: 'Watched',
    averageRating: 4.7,
    body: 'A quiet first-contact story about language, memory, and the shape of a life.',
    image:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Past Lives',
    year: '2023',
    runtime: '106 min',
    platform: 'Max',
    genre: 'Drama',
    status: 'Watchlist',
    averageRating: 4.5,
    body: 'A delicate film about timing, identity, and the lives we almost lived.',
    image:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=900&auto=format&fit=crop',
  },
];

export const comments = [
  {
    user: 'Mara',
    mood: 'Mind blown',
    text: 'That final scene made the whole episode click for me.',
    likes: 128,
  },
  {
    user: 'Jonas',
    mood: 'Tense',
    text: 'I love how every small silence feels like a clue.',
    likes: 74,
  },
  {
    user: 'Leyla',
    mood: 'Loved it',
    text: 'This is exactly why I wait to read reactions until I finish.',
    likes: 52,
  },
];

export const customLists: CustomList[] = [
  {
    title: 'Comfort rewatches',
    count: '12 titles',
    privacy: 'Private',
    images: [favoriteShows[1].image, favoriteShows[2].image, movies[1].image],
    items: [
      { title: 'The Bear', meta: 'Show - Comedy drama', image: favoriteShows[1].image },
      { title: 'Dark', meta: 'Show - Mystery', image: favoriteShows[2].image },
      { title: 'Past Lives', meta: 'Movie - Drama', image: movies[1].image },
    ],
  },
  {
    title: 'Mind-bending nights',
    count: '9 titles',
    privacy: 'Public',
    images: [favoriteShows[0].image, movies[0].image, favoriteShows[2].image],
    items: [
      { title: 'Severance', meta: 'Show - Apple TV+', image: favoriteShows[0].image },
      { title: 'Arrival', meta: 'Movie - Paramount+', image: movies[0].image },
      { title: 'Dark', meta: 'Show - Mystery', image: favoriteShows[2].image },
    ],
  },
  {
    title: 'Short and finished',
    count: '16 titles',
    privacy: 'Private',
    images: [favoriteShows[3].image, movies[1].image, favoriteShows[1].image],
    items: [
      { title: 'Station Eleven', meta: 'Limited series - Max', image: favoriteShows[3].image },
      { title: 'Past Lives', meta: 'Movie - Max', image: movies[1].image },
      { title: 'The Bear', meta: 'Show - Hulu', image: favoriteShows[1].image },
    ],
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 'new-the-bear',
    type: 'New episode',
    title: 'The Bear has a new episode tonight',
    body: 'S03 | E05 - Children airs at 9:00 PM.',
    time: '12 min ago',
    unread: true,
    icon: CalendarDays,
    tone: accent,
  },
  {
    id: 'reply-mara',
    type: 'Reply',
    title: 'Mara replied to your reaction',
    body: 'On Severance S02 | E04.',
    time: '1 hr ago',
    unread: true,
    icon: MessageCircle,
    tone: gold,
  },
  {
    id: 'badge-night-owl',
    type: 'Badge',
    title: 'You earned Night Owl',
    body: 'Three late-night episodes this week.',
    time: 'Yesterday',
    unread: false,
    icon: Medal,
    tone: '#f4f5ef',
  },
  {
    type: 'Reminder',
    title: 'Slow Horses returns tomorrow',
    body: 'Your alert is set for Apple TV+ release time.',
    time: 'Yesterday',
    unread: false,
    icon: Bell,
    tone: accent,
  },
];
