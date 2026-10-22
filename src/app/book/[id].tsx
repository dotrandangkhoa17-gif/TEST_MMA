import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useBooks } from '../../context/BooksContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SelectPicker, SelectOption } from '../../components/common/SelectPicker';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { validateBookForm } from '../../utils/validation';
import { Book, BookFormData, BookFormErrors } from '../../types';

const GENRE_OPTIONS: SelectOption[] = [
  { label: 'Choose genre', value: '' },
  { label: 'Fiction', value: 'Fiction' },
  { label: 'Non-Fiction', value: 'Non-Fiction' },
  { label: 'Academic', value: 'Academic' },
  { label: 'Other', value: 'Other' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { label: 'Choose status', value: '' },
  { label: 'To Read', value: 'To Read' },
  { label: 'Reading', value: 'Reading' },
  { label: 'Finished', value: 'Finished' },
];

export default function BookDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const normalizedId = Array.isArray(id) ? id[0] : (id || '');
  const { user, loading: authLoading } = useAuth();
  const { getBookById, updateBook, deleteBook, toggleFavorite, loading: booksLoading } = useBooks();

  const bookFromContext = getBookById(normalizedId);
  const [directBook, setDirectBook] = useState<Book | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  // Fallback direct Firestore fetch if book is not immediately in Context
  useEffect(() => {
    if (bookFromContext || !user || !normalizedId || booksLoading) return;

    let isMounted = true;
    const fetchDirect = async () => {
      setIsFetchingDirect(true);
      try {
        const rawId = normalizedId.trim();
        let docSnap = await getDoc(doc(db, 'books', rawId));
        if (!docSnap.exists()) {
          try {
            docSnap = await getDoc(doc(db, 'books', decodeURIComponent(rawId)));
          } catch {}
        }
        if (!docSnap.exists()) {
          try {
            docSnap = await getDoc(doc(db, 'books', encodeURIComponent(rawId)));
          } catch {}
        }

        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          if (data.userId === user.uid) {
            setDirectBook({
              id: docSnap.id,
              userId: data.userId,
              title: data.title || '',
              author: data.author || '',
              genre: data.genre,
              status: data.status,
              rating: typeof data.rating === 'number' ? data.rating : null,
              favorite: Boolean(data.favorite),
              notes: data.notes || '',
              createdAt: data.createdAt,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching book directly:', err);
      } finally {
        if (isMounted) setIsFetchingDirect(false);
      }
    };

    fetchDirect();
    return () => {
      isMounted = false;
    };
  }, [bookFromContext, user, normalizedId, booksLoading]);

  const book = bookFromContext || directBook;

  // Access control
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');

  const [formErrors, setFormErrors] = useState<BookFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Populate edit fields when switching to edit mode
  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setGenre(book.genre);
      setStatus(book.status);
      setRating(book.rating !== null && book.rating !== undefined ? String(book.rating) : '');
      setNotes(book.notes || '');
    }
  }, [book, isEditing]);

  const handleFieldChange = (field: keyof BookFormData, value: string) => {
    if (field === 'title') setTitle(value);
    if (field === 'author') setAuthor(value);
    if (field === 'genre') setGenre(value);
    if (field === 'status') setStatus(value);
    if (field === 'rating') setRating(value);
    if (field === 'notes') setNotes(value);

    if (editError) setEditError(null);

    if (hasSubmitted) {
      const updatedData: BookFormData = {
        title: field === 'title' ? value : title,
        author: field === 'author' ? value : author,
        genre: field === 'genre' ? value : genre,
        status: field === 'status' ? value : status,
        rating: field === 'rating' ? value : rating,
        notes: field === 'notes' ? value : notes,
      };
      const errors = validateBookForm(updatedData);
      setFormErrors(errors);
    }
  };

  const handleSave = async () => {
    if (!book) return;
    setHasSubmitted(true);
    setEditError(null);

    const formData: BookFormData = {
      title,
      author,
      genre,
      status,
      rating,
      notes,
    };

    const errors = validateBookForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedId = await updateBook(book.id, formData);
      setHasSubmitted(false);
      setIsEditing(false);
      if (updatedId && updatedId !== book.id) {
        router.replace(`/book/${updatedId}`);
      }
    } catch (err: any) {
      console.error('Error updating book:', err);
      setEditError(err.message || 'Failed to update book');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setGenre(book.genre);
      setStatus(book.status);
      setRating(book.rating !== null && book.rating !== undefined ? String(book.rating) : '');
      setNotes(book.notes || '');
    }
    setFormErrors({});
    setHasSubmitted(false);
    setEditError(null);
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    if (!book) return;
    setIsDeleting(true);
    try {
      await deleteBook(book.id);
      setIsDeleteModalVisible(false);
      router.replace('/list');
    } catch (err: any) {
      console.error('Error deleting book:', err);
      setIsDeleting(false);
    }
  };

  if (authLoading || !user || (!book && (booksLoading || isFetchingDirect))) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/list')}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backBtnText}>Back to List</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundContainer}>
          <View style={styles.notFoundIconCircle}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.notFoundTitle}>Book Not Found</Text>
          <Text style={styles.notFoundDesc}>
            This book may have been deleted or does not exist.
          </Text>
          <Button
            title="Return to Bookshelf"
            onPress={() => router.replace('/list')}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/list')}
          disabled={isEditing && isSaving}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backBtnText}>Back to Books</Text>
        </TouchableOpacity>

        {/* Favorite toggle star button */}
        <TouchableOpacity
          style={styles.starToggle}
          onPress={() => toggleFavorite(book.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={book.favorite ? 'star' : 'star-outline'}
            size={28}
            color={book.favorite ? colors.starActive : colors.starInactive}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <View style={styles.editSection}>
              <View style={styles.editHeader}>
                <View style={styles.editIconBadge}>
                  <Ionicons name="create" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.editTitle}>Edit Book Details</Text>
                  <Text style={styles.editSub}>Update catalog attributes or review notes</Text>
                </View>
              </View>

              {editError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorText}>{editError}</Text>
                </View>
              ) : null}

              <Input
                label="Title *"
                placeholder="Enter title"
                value={title}
                onChangeText={(val) => handleFieldChange('title', val)}
                error={hasSubmitted ? formErrors.title : null}
              />

              <Input
                label="Author *"
                placeholder="Enter author"
                value={author}
                onChangeText={(val) => handleFieldChange('author', val)}
                error={hasSubmitted ? formErrors.author : null}
              />

              <SelectPicker
                label="Genre *"
                placeholder="Choose genre"
                options={GENRE_OPTIONS}
                selectedValue={genre}
                onValueChange={(val) => handleFieldChange('genre', val)}
                error={hasSubmitted ? formErrors.genre : null}
              />

              <SelectPicker
                label="Status *"
                placeholder="Choose status"
                options={STATUS_OPTIONS}
                selectedValue={status}
                onValueChange={(val) => handleFieldChange('status', val)}
                error={hasSubmitted ? formErrors.status : null}
              />

              <Input
                label="Rating (Optional, 0 - 5)"
                placeholder="Score from 0 to 5"
                keyboardType="numeric"
                value={rating}
                onChangeText={(val) => handleFieldChange('rating', val)}
                error={hasSubmitted ? formErrors.rating : null}
              />

              <Input
                label="Notes (Optional, max 300 characters)"
                placeholder="Personal thoughts, quotes, or notes..."
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={(val) => handleFieldChange('notes', val)}
                error={hasSubmitted ? formErrors.notes : null}
              />

              {/* Action Buttons: Save & Cancel */}
              <View style={styles.buttonRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleCancelEdit}
                  style={styles.actionBtn}
                  disabled={isSaving}
                />
                <Button
                  title="Save"
                  variant="primary"
                  onPress={handleSave}
                  style={styles.actionBtn}
                  loading={isSaving}
                  icon={<Ionicons name="checkmark-done" size={18} color={colors.textInverted} />}
                />
              </View>
            </View>
          ) : (
            /* ================= VIEW MODE ================= */
            <View style={styles.viewSection}>
              {/* Title & Author */}
              <View style={styles.titleArea}>
                <View style={styles.bookHeaderRow}>
                  <View style={styles.bookIconBadge}>
                    <Ionicons name="book" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>by {book.author}</Text>
                  </View>
                </View>
              </View>

              {/* Metadata Badges Grid */}
              <View style={styles.metadataGrid}>
                {/* Genre Box */}
                <View style={styles.metaCard}>
                  <Text style={styles.metaCardLabel}>GENRE</Text>
                  <View style={styles.genreBadge}>
                    <Text style={styles.genreBadgeText}>{book.genre}</Text>
                  </View>
                </View>

                {/* Status Box */}
                <View style={styles.metaCard}>
                  <Text style={styles.metaCardLabel}>STATUS</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      book.status === 'To Read'
                        ? { backgroundColor: colors.toReadLight, borderColor: colors.toReadBorder }
                        : book.status === 'Reading'
                        ? { backgroundColor: colors.readingLight, borderColor: colors.readingBorder }
                        : { backgroundColor: colors.finishedLight, borderColor: colors.finishedBorder },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        book.status === 'To Read'
                          ? { color: colors.toRead }
                          : book.status === 'Reading'
                          ? { color: colors.reading }
                          : { color: colors.finished },
                      ]}
                    >
                      {book.status}
                    </Text>
                  </View>
                </View>

                {/* Rating Box */}
                <View style={styles.metaCard}>
                  <Text style={styles.metaCardLabel}>RATING</Text>
                  <View style={styles.ratingBox}>
                    {book.rating !== null && book.rating !== undefined ? (
                      <View style={styles.ratingContent}>
                        <Ionicons name="star" size={16} color={colors.starActive} />
                        <Text style={styles.ratingText}>{book.rating} / 5</Text>
                      </View>
                    ) : (
                      <Text style={styles.unratedText}>Not rated</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Notes Section */}
              <View style={styles.notesSection}>
                <View style={styles.notesHeaderRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <Text style={styles.notesLabel}>Notes</Text>
                </View>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>
                    {book.notes && book.notes.trim() !== ''
                      ? book.notes
                      : 'No notes provided for this book.'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Edit and Delete */}
              <View style={styles.buttonRow}>
                <Button
                  title="Edit Book"
                  variant="primary"
                  onPress={() => setIsEditing(true)}
                  style={styles.actionBtn}
                  icon={<Ionicons name="create-outline" size={18} color={colors.textInverted} />}
                />
                <Button
                  title="Delete Book"
                  variant="danger"
                  onPress={() => setIsDeleteModalVisible(true)}
                  style={styles.actionBtn}
                  icon={<Ionicons name="trash-outline" size={18} color={colors.textInverted} />}
                />
              </View>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Confirmation Modal for Delete Action */}
      <ConfirmModal
        visible={isDeleteModalVisible}
        title="Delete Book"
        message={`Are you sure you want to permanently delete "${book.title}" from your bookshelf? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalVisible(false)}
        loading={isDeleting}
      />
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtnText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  starToggle: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#D8E5F8',
    ...shadows.card,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notFoundIconCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  notFoundTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notFoundDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  viewSection: {},
  titleArea: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bookIconBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D0E3FF',
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 28,
  },
  bookAuthor: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 15,
  },
  metadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaCard: {
    flex: 1,
    minWidth: 95,
    backgroundColor: '#FAFCFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    alignItems: 'center',
  },
  metaCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  genreBadge: {
    backgroundColor: '#F0F5FC',
    borderWidth: 1,
    borderColor: '#D4E4F7',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreBadgeText: {
    ...typography.small,
    color: colors.primary,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...typography.small,
    fontWeight: '800',
  },
  ratingBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.captionMedium,
    color: colors.warning,
    fontWeight: '800',
  },
  unratedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  notesSection: {
    marginBottom: spacing.xl,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs + 2,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notesBox: {
    backgroundColor: '#F8FAFD',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 85,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  editSection: {},
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editTitle: {
    ...typography.h2,
    color: colors.text,
  },
  editSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.errorBorder,
    borderWidth: 1.5,
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
});
