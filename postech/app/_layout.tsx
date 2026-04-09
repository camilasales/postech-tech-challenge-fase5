import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { PersonalizationProvider } from '@/context/PersonalizationContext';
import { RemindersProvider } from '@/context/RemindersContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PersonalizationProvider>
        <AuthProvider>
          <RemindersProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'default',
              }}
            />
          </RemindersProvider>
        </AuthProvider>
      </PersonalizationProvider>
    </QueryClientProvider>
  );
}