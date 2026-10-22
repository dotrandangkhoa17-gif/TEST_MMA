import { BookFormData, BookFormErrors } from '../types';

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  // Standard email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (
  password: string,
  isRegister: boolean = false
): string | null => {
  if (!password || password === '') {
    return 'Password is required';
  }
  if (isRegister && password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword || confirmPassword === '') {
    return 'Confirm password is required';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match';
  }
  return null;
};

export const validateBookForm = (data: BookFormData): BookFormErrors => {
  const errors: BookFormErrors = {};

  // Title validation
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  } else if (data.title.length > 100) {
    errors.title = 'Title must be at most 100 characters';
  }

  // Author validation
  if (!data.author || data.author.trim() === '') {
    errors.author = 'Author is required';
  } else if (data.author.length > 60) {
    errors.author = 'Author must be at most 60 characters';
  }

  // Genre validation
  const validGenres = ['Fiction', 'Non-Fiction', 'Academic', 'Other'];
  if (!data.genre || data.genre === '' || data.genre === 'Choose genre' || !validGenres.includes(data.genre)) {
    errors.genre = 'Please choose a genre';
  }

  // Status validation
  const validStatuses = ['To Read', 'Reading', 'Finished'];
  if (!data.status || data.status === '' || data.status === 'Choose status' || !validStatuses.includes(data.status)) {
    errors.status = 'Please choose a status';
  }

  // Rating validation (optional, only if entered)
  if (data.rating !== undefined && data.rating !== null && data.rating.trim() !== '') {
    const trimmed = data.rating.trim();
    // Must be a whole number from 0 to 5
    const isWholeNumber = /^[0-5]$/.test(trimmed);
    if (!isWholeNumber) {
      errors.rating = 'Rating must be a whole number from 0 to 5';
    }
  }

  // Notes validation (optional, max 300 characters)
  if (data.notes && data.notes.length > 300) {
    errors.notes = 'Notes must be at most 300 characters';
  }

  return errors;
};
