import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { TaskListScreen } from '@/screens/TaskListScreen';

const BLUE = '#2563EB';

export default function Index() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <TaskListScreen />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
