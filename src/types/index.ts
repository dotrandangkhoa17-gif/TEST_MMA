export type Genre = 'Fiction' | 'Non-Fiction' | 'Academic' | 'Other';

export type BookStatus = 'To Read' | 'Reading' | 'Finished';

export interface Book {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  author: string;
  genre: Genre;
  status: BookStatus;
  rating?: number | null;
  favorite: boolean;
  notes?: string | null;
  createdAt?: any;
}

export interface BookFormData {
  title: string;
  author: string;
  genre: string;
  status: string;
  rating?: string;
  notes?: string;
}

export interface BookFormErrors {
  title?: string;
  author?: string;
  genre?: string;
  status?: string;
  rating?: string;
  notes?: string;
}

export interface FilterState {
  genre: string; // 'All' | Genre
  status: string; // 'All' | BookStatus
  favoritesOnly: boolean;
  searchQuery: string;
}
