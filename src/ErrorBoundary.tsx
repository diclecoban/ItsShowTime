import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { styles } from './styles';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('frontend render error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.errorBoundary}>
        <Text style={styles.errorBoundaryTitle}>Something went wrong</Text>
        <Text style={styles.errorBoundaryText}>The app hit a frontend error. Reloading usually clears this state.</Text>
        <Pressable style={styles.adminWideActionButton} onPress={() => window.location.reload()}>
          <Text style={styles.adminActionText}>Reload</Text>
        </Pressable>
      </View>
    );
  }
}
