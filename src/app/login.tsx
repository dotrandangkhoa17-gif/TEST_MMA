import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { validateEmail, validatePassword } from '../utils/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (hasSubmitted) {
      setEmailError(validateEmail(text));
    }
    if (authError) setAuthError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (hasSubmitted) {
      setPasswordError(validatePassword(text, false));
    }
    if (authError) setAuthError(null);
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    setAuthError(null);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password, false);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) {
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/list');
    } catch (err: any) {
      console.error('Login error:', err);
      let message = err.message || 'Failed to login';
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'This user account has been disabled.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address';
      }
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>

          <Card style={styles.card}>
            <View style={styles.titleSection}>
              <View style={styles.iconCircle}>
                <Ionicons name="log-in" size={28} color={colors.primary} />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue managing your BookShelf
              </Text>
            </View>

            {/* Auth Error Banner */}
            {authError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text testID="error-auth" style={styles.errorText}>
                  {authError}
                </Text>
              </View>
            ) : null}

            {/* Form Inputs */}
            <Input
              label="Email"
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={handleEmailChange}
              error={hasSubmitted ? emailError : null}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={handlePasswordChange}
              error={hasSubmitted ? passwordError : null}
            />

            <Button
              title="Login"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
              icon={<Ionicons name="log-in-outline" size={18} color={colors.textInverted} />}
            />

            <View style={styles.footerLink}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/register')}>
                <Text style={styles.registerLink}>Register now</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    justifyContent: 'center',
    flexGrow: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  backText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  card: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#D8E5F8',
    ...shadows.card,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
    borderWidth: 2,
    borderColor: '#D0E3FF',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    fontSize: 24,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.captionMedium,
    color: colors.error,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.sm,
    paddingVertical: 13,
  },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.captionMedium,
    color: colors.primary,
    fontWeight: '800',
  },
});
