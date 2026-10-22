import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Book, BookFormData, Genre, BookStatus } from '../types';

interface BooksContextType {
  books: Book[];
  loading: boolean;
  error: string | null;
  addBook: (data: BookFormData) => Promise<void>;
  updateBook: (id: string, data: BookFormData) => Promise<string>;
  deleteBook: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getBookById: (id: string) => Book | undefined;
}

const BooksContext = createContext<BooksContextType>({} as BooksContextType);

export const BooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Real-time listener for current user's books in collection 'books'
    const booksRef = collection(db, 'books');
    const q = query(booksRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedBooks: Book[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedBooks.push({
            id: docSnap.id,
            userId: data.userId,
            title: data.title || '',
            author: data.author || '',
            genre: data.genre as Genre,
            status: data.status as BookStatus,
            rating: typeof data.rating === 'number' ? data.rating : null,
            favorite: Boolean(data.favorite),
            notes: data.notes || '',
            createdAt: data.createdAt,
          });
        });

        // Sort alphabetically by title (case-insensitive); if same title, sort by author
        fetchedBooks.sort((a, b) => {
          const titleComparison = a.title.localeCompare(b.title, undefined, {
            sensitivity: 'base',
          });
          if (titleComparison !== 0) {
            return titleComparison;
          }
          return a.author.localeCompare(b.author, undefined, {
            sensitivity: 'base',
          });
        });

        setBooks(fetchedBooks);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to books:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addBook = async (formData: BookFormData) => {
    if (!user) throw new Error('User is not authenticated');

    const cleanTitle = formData.title.trim();
    const cleanAuthor = formData.author.trim();
    const normTitle = cleanTitle.toLowerCase();
    const normAuthor = cleanAuthor.toLowerCase();

    // Check for duplicate title + author for this user in local state
    const isDuplicate = books.some(
      (b) =>
        b.title.trim().toLowerCase() === normTitle &&
        b.author.trim().toLowerCase() === normAuthor
    );

    if (isDuplicate) {
      throw new Error('A book with this title and author already exists in your bookshelf.');
    }

    // Deterministic document ID scoped to userId to guarantee Firestore-level uniqueness
    const slugTitle = normTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const slugAuthor = normAuthor.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const docId = `${user.uid}_${slugTitle || 'title'}_${slugAuthor || 'author'}`.slice(0, 100);
    const docRef = doc(db, 'books', docId);

    const parsedRating =
      formData.rating && formData.rating.trim() !== ''
        ? parseInt(formData.rating.trim(), 10)
        : null;

    const payload: any = {
      id: docId,
      userId: user.uid,
      title: cleanTitle,
      author: cleanAuthor,
      genre: formData.genre,
      status: formData.status,
      rating: parsedRating !== null && !isNaN(parsedRating) ? parsedRating : null,
      favorite: false,
      notes: formData.notes ? formData.notes.trim() : '',
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, payload);
  };

  const updateBook = async (id: string, formData: BookFormData) => {
    if (!user) throw new Error('User is not authenticated');

    const cleanTitle = formData.title.trim();
    const cleanAuthor = formData.author.trim();
    const normTitle = cleanTitle.toLowerCase();
    const normAuthor = cleanAuthor.toLowerCase();

    // Check for duplicate title + author on other books
    const isDuplicate = books.some(
      (b) =>
        b.id !== id &&
        b.title.trim().toLowerCase() === normTitle &&
        b.author.trim().toLowerCase() === normAuthor
    );

    if (isDuplicate) {
      throw new Error('Another book with this title and author already exists.');
    }

    const slugTitle = normTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const slugAuthor = normAuthor.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const newDocId = `${user.uid}_${slugTitle || 'title'}_${slugAuthor || 'author'}`.slice(0, 100);

    const parsedRating =
      formData.rating && formData.rating.trim() !== ''
        ? parseInt(formData.rating.trim(), 10)
        : null;

    const currentBook = books.find((b) => b.id === id);

    if (newDocId !== id) {
      // Title or author changed: create new doc with updated id and delete old doc
      const newDocRef = doc(db, 'books', newDocId);
      const oldDocRef = doc(db, 'books', id);

      const newPayload: any = {
        id: newDocId,
        userId: user.uid,
        title: cleanTitle,
        author: cleanAuthor,
        genre: formData.genre,
        status: formData.status,
        rating: parsedRating !== null && !isNaN(parsedRating) ? parsedRating : null,
        favorite: currentBook ? currentBook.favorite : false,
        notes: formData.notes ? formData.notes.trim() : '',
        createdAt: currentBook?.createdAt || serverTimestamp(),
      };

      await setDoc(newDocRef, newPayload);
      await deleteDoc(oldDocRef);
      return newDocId;
    } else {
      // Same id: simply update existing document
      const docRef = doc(db, 'books', id);
      const payload: any = {
        title: cleanTitle,
        author: cleanAuthor,
        genre: formData.genre,
        status: formData.status,
        notes: formData.notes ? formData.notes.trim() : '',
      };

      if (parsedRating !== null && !isNaN(parsedRating)) {
        payload.rating = parsedRating;
      } else {
        payload.rating = null;
      }

      await updateDoc(docRef, payload);
      return id;
    }
  };

  const deleteBook = async (id: string) => {
    if (!user) throw new Error('User is not authenticated');
    const docRef = doc(db, 'books', id);
    await deleteDoc(docRef);
  };

  const toggleFavorite = async (id: string) => {
    if (!user) throw new Error('User is not authenticated');
    const book = getBookById(id);
    if (!book) return;

    const docRef = doc(db, 'books', book.id);
    await updateDoc(docRef, {
      favorite: !book.favorite,
    });
  };

  const getBookById = (rawId: string) => {
    if (!rawId) return undefined;
    const id = String(rawId).trim();
    let decoded = id;
    let encoded = id;
    try {
      decoded = decodeURIComponent(id);
    } catch {}
    try {
      encoded = encodeURIComponent(id);
    } catch {}

    return books.find((b) => {
      if (b.id === id) return true;
      if (b.id === decoded) return true;
      if (b.id === encoded) return true;
      try {
        if (decodeURIComponent(b.id) === decoded) return true;
        if (encodeURIComponent(b.id) === encoded) return true;
      } catch {}
      return false;
    });
  };

  return (
    <BooksContext.Provider
      value={{
        books,
        loading,
        error,
        addBook,
        updateBook,
        deleteBook,
        toggleFavorite,
        getBookById,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
};

export const useBooks = () => useContext(BooksContext);
