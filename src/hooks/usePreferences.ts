import { useState } from 'react';

import type { ThemeName } from '../theme';

const defaultGenres = ['Drama', 'Mystery', 'Comedy'];
const defaultServices = ['Netflix', 'Apple TV+', 'Max'];

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function usePreferences() {
  const [selectedGenres, setSelectedGenres] = useState(defaultGenres);
  const [selectedServices, setSelectedServices] = useState(defaultServices);
  const [activeTheme, setActiveTheme] = useState<ThemeName>('Pantone 1');

  return {
    activeTheme,
    selectedGenres,
    selectedServices,
    setActiveTheme,
    setSelectedGenres,
    setSelectedServices,
    toggleGenre: (genre: string) => setSelectedGenres((genres) => toggleValue(genres, genre)),
    toggleService: (service: string) => setSelectedServices((services) => toggleValue(services, service)),
  };
}
