import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { BooksProvider } from '../context/BooksContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BooksProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F8FAFC' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="list" />
            <Stack.Screen name="book/[id]" />
          </Stack>
        </BooksProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
