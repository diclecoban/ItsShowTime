import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isCompact: width < 430,
    isTablet: width >= 768,
    isDesktop: width >= 1024,
  };
}
