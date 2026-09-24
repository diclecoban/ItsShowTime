import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Pressable, Text, View } from 'react-native';

import { bg, ink } from '../theme';
import { styles } from '../styles';

const privacySections = [
  {
    title: 'Data we collect',
    body: 'We store your account profile, show library, watch progress, reactions, comments, lists, reminders, notification preferences, and device push tokens when permission is granted.',
  },
  {
    title: 'How we use data',
    body: 'We use your data to sync your library, personalize discovery, protect spoilers, deliver reminders, operate support flows, and keep the service reliable.',
  },
  {
    title: 'Third-party services',
    body: 'The app may use Supabase for authentication and database services, TVmaze for show catalog data, Expo for push notifications, and optional email/support providers when configured.',
  },
  {
    title: 'Deletion',
    body: 'You can request account deletion from Settings. Deletion requests are audited so the service can confirm completion and diagnose failures.',
  },
];

const termsSections = [
  {
    title: 'Acceptable use',
    body: 'Do not post abusive content, harassment, illegal content, or intentionally unmarked spoilers. Community content can be reported or hidden.',
  },
  {
    title: 'Catalog data',
    body: 'Show metadata comes from external catalog providers. Availability, ratings, summaries, posters, and episode information may change or be incomplete.',
  },
  {
    title: 'Support funding',
    body: 'Support links help fund broader catalog coverage and operations. Current support flows do not unlock a paid premium entitlement unless explicitly stated later.',
  },
  {
    title: 'Service changes',
    body: 'Features may change as the product develops, especially movies, recommendations, notifications, and community tools.',
  },
];

export function LegalPage({
  kind,
  onBack,
}: {
  kind: 'privacy' | 'terms';
  onBack: () => void;
}) {
  const sections = kind === 'privacy' ? privacySections : termsSections;

  return (
    <View>
      <Pressable style={styles.detailBack} onPress={onBack}>
        <ArrowLeft color={ink} size={20} />
        <Text style={styles.detailBackText}>Back</Text>
      </Pressable>

      <View style={styles.legalHero}>
        <View style={styles.emptyIconWrap}>
          <ShieldCheck color={bg} size={26} />
        </View>
        <Text style={styles.libraryKicker}>It’s Showtime</Text>
        <Text style={styles.libraryTitle}>{kind === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</Text>
        <Text style={styles.libraryBody}>Last updated: September 15, 2026</Text>
      </View>

      <View style={styles.legalStack}>
        {sections.map((section) => (
          <View key={section.title} style={styles.legalCard}>
            <Text style={styles.customListTitle}>{section.title}</Text>
            <Text style={styles.legalBody}>{section.body}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legalCard}>
        <Text style={styles.customListTitle}>Contact</Text>
        <Text style={styles.legalBody}>For privacy, deletion, or support requests, add your production support email before launch.</Text>
      </View>
    </View>
  );
}
