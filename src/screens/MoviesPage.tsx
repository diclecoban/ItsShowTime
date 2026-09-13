import { Lock, Star } from 'lucide-react';
import { ImageBackground, Pressable, Text, View } from 'react-native';

import { bg, gold, ink, muted } from '../theme';
import { styles } from '../styles';
import type { Movie } from '../types';

export function MoviesPage({ movies, onSelectMovie }: { movies: Movie[]; onSelectMovie: (movie: Movie) => void }) {
  return (
    <View>
      <View style={styles.movieLockedHero}>
        <View style={styles.movieLockIcon}>
          <Lock color={bg} size={26} />
        </View>
        <Text style={styles.movieLockedTitle}>Movies are coming when the budget is ready</Text>
        <Text style={styles.movieLockedBody}>
          Series tracking is free while we keep building the catalog. A richer movie database, ratings, lists, and reactions
          will unlock when It’s Showtime has the budget for broader data access.
        </Text>
        <Pressable
          style={styles.supportUsButton}
          onPress={() => window.open('https://buymeacoffee.com/diclesara', '_blank', 'noopener,noreferrer')}
        >
          <Text style={styles.supportUsText}>Support us</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Preview</Text>
      {movies.slice(0, 2).map((movie) => (
        <Pressable key={movie.id} style={styles.movieCard} onPress={() => onSelectMovie(movie)}>
          <ImageBackground
            source={{ uri: movie.image }}
            style={styles.moviePoster}
            imageStyle={styles.moviePosterImage}
            resizeMode="cover"
          />
          <View style={styles.movieCardCopy}>
            <Text style={styles.movieTitle}>{movie.title}</Text>
            <Text style={styles.movieMeta}>{movie.year} - {movie.runtime} - {movie.genre}</Text>
            <Text style={styles.movieBody}>{movie.body}</Text>
            <View style={styles.movieFooter}>
              <Text style={styles.platformPill}>{movie.platform}</Text>
              <View style={styles.timelineRatingBadge}>
                <Star color={gold} fill={gold} size={12} />
                <Text style={styles.ratingText}>{movie.averageRating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
