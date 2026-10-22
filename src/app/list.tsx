import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SelectPicker, SelectOption } from '../components/common/SelectPicker';
import { validateBookForm } from '../utils/validation';
import { Book, BookFormData, BookFormErrors } from '../types';

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

const FILTER_GENRES = ['All', 'Fiction', 'Non-Fiction', 'Academic', 'Other'];
const FILTER_STATUSES = ['All', 'To Read', 'Reading', 'Finished'];

const STATUS_PRIORITY: Record<string, number> = {
  'To Read': 1,
  'Reading': 2,
  'Finished': 3,
};

export default function ListScreen() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { books, loading: booksLoading, addBook, toggleFavorite } = useBooks();

  // Redirect if not authenticated (zero flash of protected content)
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading]);

  // Add Book Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');

  const [formErrors, setFormErrors] = useState<BookFormErrors>({});
  const [hasSubmittedForm, setHasSubmittedForm] = useState(false);
  const [bookSuccess, setBookSuccess] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  // Filter & Search states
  const [filterGenre, setFilterGenre] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time error validation on input change after initial submit
  const handleFieldChange = (field: keyof BookFormData, value: string) => {
    if (field === 'title') setTitle(value);
    if (field === 'author') setAuthor(value);
    if (field === 'genre') setGenre(value);
    if (field === 'status') setStatus(value);
    if (field === 'rating') setRating(value);
    if (field === 'notes') setNotes(value);

    if (bookError) setBookError(null);
    if (bookSuccess) setBookSuccess(null);

    if (hasSubmittedForm) {
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

  // Submit Add Book Form
  const handleAddBook = async () => {
    setHasSubmittedForm(true);
    setBookSuccess(null);
    setBookError(null);

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

    setIsSubmitting(true);
    try {
      await addBook(formData);
      // On success: clear form, reset errors, show Book added
      setTitle('');
      setAuthor('');
      setGenre('');
      setStatus('');
      setRating('');
      setNotes('');
      setHasSubmittedForm(false);
      setFormErrors({});
      setBookSuccess('Book added');
    } catch (err: any) {
      console.error('Error adding book:', err);
      setBookError(err.message || 'Failed to add book');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset all 4 filters to default
  const handleClearFilters = () => {
    setFilterGenre('All');
    setFilterStatus('All');
    setFavoritesOnly(false);
    setSearchQuery('');
  };

  // Filtered books (combined simultaneously)
  const displayedBooks = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      // 1. Genre filter
      if (filterGenre !== 'All' && book.genre !== filterGenre) {
        return false;
      }
      // 2. Status filter
      if (filterStatus !== 'All' && book.status !== filterStatus) {
        return false;
      }
      // 3. Favorites only switch
      if (favoritesOnly && !book.favorite) {
        return false;
      }
      // 4. Search query (case-insensitive substring of title or author, trimmed)
      if (trimmedQuery.length > 0) {
        const matchesTitle = book.title.toLowerCase().includes(trimmedQuery);
        const matchesAuthor = book.author.toLowerCase().includes(trimmedQuery);
        if (!matchesTitle && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [books, filterGenre, filterStatus, favoritesOnly, searchQuery]);

  // Summary counts
  const favoriteCount = useMemo(() => {
    return displayedBooks.filter((b) => b.favorite).length;
  }, [displayedBooks]);

  // Status breakdown: row for each present status in displayedBooks, sorted descending by count
  // Tie-breaker: To Read > Reading > Finished
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    displayedBooks.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([st, count]) => ({ status: st, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return (STATUS_PRIORITY[a.status] || 99) - (STATUS_PRIORITY[b.status] || 99);
      });
  }, [displayedBooks]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Prevent flash while checking auth
  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View testID="list-screen" style={styles.container}>
        {/* Header with user email and Logout button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.appBrandRow}>
              <View style={styles.appBrandDot} />
              <Text style={styles.appBrandText}>BookShelf</Text>
            </View>
            <View style={styles.userEmailRow}>
              <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
              <Text numberOfLines={1} style={styles.userEmail}>
                {user.email}
              </Text>
            </View>
          </View>
          <Button
            title="Logout"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutBtn}
            textStyle={styles.logoutBtnText}
            icon={<Ionicons name="log-out-outline" size={15} color={colors.primary} />}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section A: Add a Book Form */}
          <Card style={styles.formCard}>
            <TouchableOpacity
              style={styles.formHeader}
              activeOpacity={0.75}
              onPress={() => setIsFormExpanded(!isFormExpanded)}
            >
              <View style={styles.formTitleRow}>
                <View style={styles.formIconBadge}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.formTitle}>Add a Book</Text>
                  <Text style={styles.formSub}>Catalog a new title into your collection</Text>
                </View>
              </View>
              <View style={styles.chevronBox}>
                <Ionicons
                  name={isFormExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            {isFormExpanded ? (
              <View testID="book-form" style={styles.bookForm}>
                {/* Book Success Message */}
                {bookSuccess ? (
                  <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text testID="book-success" style={styles.successText}>
                      Book added
                    </Text>
                  </View>
                ) : null}

                {/* Firestore Book Error Message */}
                {bookError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color={colors.error} />
                    <Text testID="error-book" style={styles.errorText}>
                      {bookError}
                    </Text>
                  </View>
                ) : null}

                <Input
                  label="Title *"
                  placeholder="e.g. Dune, Clean Code..."
                  value={title}
                  onChangeText={(val) => handleFieldChange('title', val)}
                  error={hasSubmittedForm ? formErrors.title : null}
                />

                <Input
                  label="Author *"
                  placeholder="e.g. Frank Herbert, Robert C. Martin..."
                  value={author}
                  onChangeText={(val) => handleFieldChange('author', val)}
                  error={hasSubmittedForm ? formErrors.author : null}
                />

                <SelectPicker
                  label="Genre *"
                  placeholder="Choose genre"
                  options={GENRE_OPTIONS}
                  selectedValue={genre}
                  onValueChange={(val) => handleFieldChange('genre', val)}
                  error={hasSubmittedForm ? formErrors.genre : null}
                />

                <SelectPicker
                  label="Status *"
                  placeholder="Choose status"
                  options={STATUS_OPTIONS}
                  selectedValue={status}
                  onValueChange={(val) => handleFieldChange('status', val)}
                  error={hasSubmittedForm ? formErrors.status : null}
                />

                <Input
                  label="Rating (Optional, 0 - 5)"
                  placeholder="Score from 0 to 5"
                  keyboardType="numeric"
                  value={rating}
                  onChangeText={(val) => handleFieldChange('rating', val)}
                  error={hasSubmittedForm ? formErrors.rating : null}
                />

                <Input
                  label="Notes (Optional, max 300 characters)"
                  placeholder="Personal thoughts, quotes, or notes..."
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={(val) => handleFieldChange('notes', val)}
                  error={hasSubmittedForm ? formErrors.notes : null}
                />

                <Button
                  title="Add Book"
                  onPress={handleAddBook}
                  loading={isSubmitting}
                  style={styles.addBookBtn}
                  icon={<Ionicons name="bookmark" size={18} color={colors.textInverted} />}
                />
              </View>
            ) : null}
          </Card>

          {/* Section C: Filter, Search, and Summary */}
          <Card style={styles.filterCard}>
            <View style={styles.filterCardHeader}>
              <Ionicons name="options-outline" size={18} color={colors.primary} />
              <Text style={styles.filterSectionTitle}>Filter, Search & Summary</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={colors.primary}
                style={styles.searchIcon}
              />
              <Input
                placeholder="Search by title or author..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={styles.searchInputContainer}
                inputStyle={styles.searchInput}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.searchClearBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Genre Filter Buttons */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Genre:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {FILTER_GENRES.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.chip,
                        filterGenre === g ? styles.chipActive : null,
                      ]}
                      onPress={() => setFilterGenre(g)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filterGenre === g ? styles.chipTextActive : null,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Status Filter Buttons */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {FILTER_STATUSES.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.chip,
                        filterStatus === st ? styles.chipActive : null,
                      ]}
                      onPress={() => setFilterStatus(st)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filterStatus === st ? styles.chipTextActive : null,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Favorites Only Switch and Clear Button */}
            <View style={styles.filterBottomRow}>
              <View style={styles.switchRow}>
                <Switch
                  value={favoritesOnly}
                  onValueChange={setFavoritesOnly}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
                <Text style={styles.switchLabel}>Favorites only</Text>
              </View>

              <Button
                title="Clear"
                variant="outline"
                onPress={handleClearFilters}
                style={styles.clearBtn}
                textStyle={styles.clearBtnText}
                icon={<Ionicons name="refresh" size={14} color={colors.primary} />}
              />
            </View>

            {/* Summary Section */}
            <View style={styles.summarySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Library Summary</Text>
              </View>

              <View style={styles.summaryStatsRow}>
                <View style={styles.statBox}>
                  <View style={styles.statIconBadge}>
                    <Ionicons name="book-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.statLabel}>Total Books</Text>
                  <Text testID="book-count" style={styles.statValue}>
                    {displayedBooks.length}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <View style={[styles.statIconBadge, { backgroundColor: colors.readingLight }]}>
                    <Ionicons name="star" size={18} color={colors.warning} />
                  </View>
                  <Text style={styles.statLabel}>Favorites</Text>
                  <Text testID="favorite-count" style={[styles.statValue, { color: colors.warning }]}>
                    {favoriteCount}
                  </Text>
                </View>
              </View>

              {/* Status Breakdown Table */}
              {statusBreakdown.length > 0 ? (
                <View style={styles.breakdownTable}>
                  <Text style={styles.breakdownHeader}>Status Breakdown</Text>
                  {statusBreakdown.map((row) => (
                    <View key={row.status} style={styles.breakdownRow}>
                      <View style={styles.breakdownLabelGroup}>
                        <View
                          style={[
                            styles.statusDot,
                            row.status === 'To Read'
                              ? { backgroundColor: colors.toRead }
                              : row.status === 'Reading'
                              ? { backgroundColor: colors.reading }
                              : { backgroundColor: colors.finished },
                          ]}
                        />
                        <Text style={styles.breakdownStatusName}>{row.status}</Text>
                      </View>
                      <View style={styles.breakdownCountBadgeBox}>
                        <Text style={styles.breakdownCountBadge}>{row.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </Card>

          {/* Section B: The Books List */}
          <View style={styles.listSection}>
            <View style={styles.listSectionHeader}>
              <View style={styles.listTitleGroup}>
                <View style={styles.bluePill} />
                <Text style={styles.listSectionTitle}>Your Books</Text>
              </View>
              <View style={styles.itemCountBadge}>
                <Text style={styles.listSubText}>
                  {displayedBooks.length} {displayedBooks.length === 1 ? 'book' : 'books'}
                </Text>
              </View>
            </View>

            {booksLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.booksLoader}
              />
            ) : displayedBooks.length === 0 ? (
              /* Empty State */
              <Card style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="folder-open-outline" size={42} color={colors.primary} />
                </View>
                <Text testID="books-empty" style={styles.emptyText}>
                  No books found
                </Text>
                <Text style={styles.emptySubText}>
                  {books.length === 0
                    ? 'Your shelf is empty. Add your first book above!'
                    : 'No books match your current filters and search query.'}
                </Text>
              </Card>
            ) : (
              /* Book Items */
              displayedBooks.map((item: Book) => (
                <View key={item.id} testID="book-item" style={styles.bookItemCard}>
                  <View style={styles.bookItemContent}>
                    {/* Left touchable area for book info leading to Detail */}
                    <TouchableOpacity
                      style={styles.bookItemLeft}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: '/book/[id]',
                          params: { id: item.id },
                        })
                      }
                    >
                      <Text style={styles.bookTitle}>{item.title}</Text>
                      <Text style={styles.bookAuthor}>by {item.author}</Text>

                      <View style={styles.badgeRow}>
                        <View style={styles.genreBadge}>
                          <Text style={styles.genreBadgeText}>{item.genre}</Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            item.status === 'To Read'
                              ? { backgroundColor: colors.toReadLight, borderColor: colors.toReadBorder }
                              : item.status === 'Reading'
                              ? { backgroundColor: colors.readingLight, borderColor: colors.readingBorder }
                              : { backgroundColor: colors.finishedLight, borderColor: colors.finishedBorder },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              item.status === 'To Read'
                                ? { color: colors.toRead }
                                : item.status === 'Reading'
                                ? { color: colors.reading }
                                : { color: colors.finished },
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>

                        {item.rating !== null && item.rating !== undefined ? (
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color={colors.starActive} />
                            <Text style={styles.ratingBadgeText}>{item.rating}/5</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* Right actions: Star favorite toggle & Chevron */}
                    <View style={styles.bookItemActions}>
                      <TouchableOpacity
                        style={styles.starButton}
                        activeOpacity={0.7}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Ionicons
                          name={item.favorite ? 'star' : 'star-outline'}
                          size={24}
                          color={item.favorite ? colors.starActive : colors.starInactive}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: '/book/[id]',
                            params: { id: item.id },
                          })
                        }
                        style={styles.detailArrowBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.soft,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  appBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  appBrandDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  appBrandText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.2,
  },
  userEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  logoutBtnText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    padding: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#D8E5F8',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  formIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    ...typography.h3,
    color: colors.text,
  },
  formSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chevronBox: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookForm: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 3,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  successText: {
    ...typography.captionMedium,
    color: colors.success,
    fontWeight: '800',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.errorBorder,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 3,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.captionMedium,
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
  addBookBtn: {
    marginTop: spacing.xs,
    paddingVertical: 13,
  },
  filterCard: {
    padding: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#D8E5F8',
  },
  filterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm + 2,
  },
  filterSectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.sm + 2,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.sm + 4,
    top: 14,
    zIndex: 1,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  searchInput: {
    paddingLeft: 38,
    paddingRight: 36,
    paddingVertical: 10,
    backgroundColor: '#FAFCFF',
  },
  searchClearBtn: {
    position: 'absolute',
    right: spacing.sm + 4,
    top: 12,
    zIndex: 1,
  },
  filterGroup: {
    marginBottom: spacing.sm + 2,
  },
  filterLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textInverted,
    fontWeight: '800',
  },
  filterBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  switchLabel: {
    ...typography.captionMedium,
    color: colors.text,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  clearBtnText: {
    fontSize: 12,
  },
  summarySection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryHeader: {
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
  },
  breakdownTable: {
    backgroundColor: '#FAFCFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  breakdownHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs + 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5FB',
  },
  breakdownLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 3,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: borderRadius.full,
  },
  breakdownStatusName: {
    ...typography.captionMedium,
    color: colors.text,
  },
  breakdownCountBadgeBox: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  breakdownCountBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  listSection: {
    marginTop: spacing.sm,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
    paddingHorizontal: 2,
  },
  listTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bluePill: {
    width: 4,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  listSectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  itemCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  listSubText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  booksLoader: {
    marginVertical: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#DCEBFF',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.h2,
    color: colors.text,
    fontSize: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  emptySubText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    fontSize: 14,
  },
  bookItemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2EBF5',
    marginBottom: spacing.sm + 2,
    ...shadows.card,
  },
  bookItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  bookItemLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  bookAuthor: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.xs + 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  genreBadge: {
    backgroundColor: '#F0F5FC',
    borderWidth: 1,
    borderColor: '#D4E4F7',
    borderRadius: borderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  genreBadgeText: {
    ...typography.small,
    color: colors.primary,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusBadgeText: {
    ...typography.small,
    fontWeight: '800',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  ratingBadgeText: {
    ...typography.small,
    color: colors.warning,
    fontWeight: '800',
  },
  bookItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starButton: {
    padding: spacing.xs + 2,
  },
  detailArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
