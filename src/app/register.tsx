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
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (hasSubmitted) {
      setEmailError(validateEmail(text));
    }
    if (authError) setAuthError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (hasSubmitted) {
      setPasswordError(validatePassword(text, true));
      if (confirmPassword) {
        setConfirmPasswordError(validateConfirmPassword(text, confirmPassword));
      }
    }
    if (authError) setAuthError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (hasSubmitted) {
      setConfirmPasswordError(validateConfirmPassword(password, text));
    }
    if (authError) setAuthError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    if (loading) return;

    setHasSubmitted(true);
    setAuthError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    const eErr = validateEmail(trimmedEmail);
    const pErr = validatePassword(password, true);
    const cErr = validateConfirmPassword(password, confirmPassword);

    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cErr);

    if (eErr || pErr || cErr) {
      return;
    }

    setLoading(true);
    try {
      await register(trimmedEmail, password);
      if (!isMountedRef.current) return;
      setSuccessMessage('Registration successful');
      setPassword('');
      setConfirmPassword('');
      setHasSubmitted(false);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('Registration error:', err);
      let message = err.message || 'Failed to register';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email address is already in use.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (typeof message === 'string' && message.startsWith('Firebase:')) {
        message = message.replace(/^Firebase:\s*/, '').replace(/\s*\([^)]*\)\.?$/, '');
      }
      setAuthError(message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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
                <Ionicons name="person-add" size={28} color={colors.primary} />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Sign up to manage and organize your personal BookShelf
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

            {/* Form Success Banner */}
            {successMessage ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text testID="form-success" style={styles.successText}>Registration successful</Text>
              </View>
            ) : null}

            {/* Form Inputs */}
            <Input
              label="Email"
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={email}
              onChangeText={handleEmailChange}
              error={hasSubmitted ? emailError : null}
            />

            <Input
              label="Password"
              placeholder="Enter your password (at least 6 characters)"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={password}
              onChangeText={handlePasswordChange}
              error={hasSubmitted ? passwordError : null}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              error={hasSubmitted ? confirmPasswordError : null}
            />

            <Button
              title="Register"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
              icon={<Ionicons name="person-add-outline" size={18} color={colors.textInverted} />}
            />

            {successMessage ? (
              <Button
                title="Go to Bookshelf"
                variant="outline"
                onPress={() => router.replace('/list')}
                style={styles.bookshelfBtn}
                icon={<Ionicons name="arrow-forward" size={18} color={colors.primary} />}
              />
            ) : null}

            <View style={styles.footerLink}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginLink}>Login here</Text>
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  successText: {
    ...typography.captionMedium,
    color: colors.success,
    fontWeight: '800',
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.sm,
    paddingVertical: 13,
  },
  bookshelfBtn: {
    marginTop: spacing.sm,
    paddingVertical: 12,
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
  loginLink: {
    ...typography.captionMedium,
    color: colors.primary,
    fontWeight: '800',
  },
});
