import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/list');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBox}>
            <Ionicons name="book" size={20} color={colors.textInverted} />
          </View>
          <View>
            <Text style={styles.headerTitle}>BookShelf</Text>
            <Text style={styles.headerSub}>Reading Manager</Text>
          </View>
        </View>

        {!user ? (
          <View style={styles.authButtons}>
            <Button
              title="Login"
              variant="outline"
              onPress={() => router.push('/login')}
              style={styles.headerBtn}
              textStyle={styles.headerBtnText}
            />
            <Button
              title="Register"
              variant="primary"
              onPress={() => router.push('/register')}
              style={styles.headerBtn}
              textStyle={styles.headerBtnText}
            />
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.heroBadgeText}>YOUR PERSONAL DIGITAL LIBRARY</Text>
          </View>

          <Text testID="home-title" style={styles.homeTitle}>
            BookShelf
          </Text>

          <Text style={styles.description}>
            Your personal digital library to organize, track reading status, categorize by genres, and rate your favorite books with ease.
          </Text>
        </View>

        {/* Feature Cards Section */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.bluePill} />
            <Text style={styles.sectionHeading}>Key Features</Text>
          </View>

          {/* Feature Card 1 */}
          <Card style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.toReadLight }]}>
              <Ionicons name="library" size={24} color={colors.toRead} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Track your books</Text>
              <Text style={styles.featureDesc}>
                Maintain your complete reading backlog, currently reading items, and finished triumphs in one clean list.
              </Text>
            </View>
          </Card>

          {/* Feature Card 2 */}
          <Card style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="filter" size={24} color={colors.primary} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Sort by status</Text>
              <Text style={styles.featureDesc}>
                Instant real-time filtering by Fiction, Non-Fiction, Academic, and reading progress with dynamic summaries.
              </Text>
            </View>
          </Card>

          {/* Feature Card 3 */}
          <Card style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.readingLight }]}>
              <Ionicons name="star" size={24} color={colors.reading} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Rate your favorites</Text>
              <Text style={styles.featureDesc}>
                Mark special books with glowing stars, score them from 0 to 5, and record your private personal notes.
              </Text>
            </View>
          </Card>
        </View>

        {/* Eye-catching Call to Action Banner */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaGlowCircle} />
          <Ionicons name="bookmarks-outline" size={36} color={colors.primary} style={{ marginBottom: spacing.xs }} />
          <Text style={styles.ctaTitle}>Ready to start your shelf?</Text>
          <Text style={styles.ctaDesc}>
            Create your free account today and keep your reading journey organized across all your devices.
          </Text>
          <Button
            title="Get Started Now"
            onPress={() => router.push('/register')}
            style={styles.ctaButton}
            icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverted} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.soft,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  authButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
  },
  headerBtnText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#D4E5FF',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  homeTitle: {
    ...typography.h1,
    fontSize: 34,
    color: colors.primary,
    marginBottom: spacing.xs + 2,
    textAlign: 'center',
    fontWeight: '900',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 24,
  },
  featuresSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bluePill: {
    width: 4,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.text,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md + 2,
    gap: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontSize: 16,
    marginBottom: 4,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#D4E5FF',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xs,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.card,
  },
  ctaGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    opacity: 0.6,
  },
  ctaTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  ctaDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ctaButton: {
    width: '100%',
    maxWidth: 290,
  },
});
