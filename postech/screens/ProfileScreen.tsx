import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SidebarLayout } from '@/components/SidebarLayout';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';
import { useAuth } from '@/context/AuthContext';

export function ProfileScreen() {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const c = theme.colors;
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    router.replace('/login');
  }, [router, signOutUser]);

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout
      activeNavKey="profile"
      desktopTopBarLeft="empty"
      onSignOut={handleSignOut}
      searchConfig={null}
      topBarRight={null}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Perfil</Text>
        <Text style={styles.pageSubtitle}>Dados da sua conta</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="person-circle-outline" size={theme.icon(48)} color={c.blue} />
            <View style={styles.cardTextBlock}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SidebarLayout>
  );
}

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.space(32),
    },
    pageTitle: {
      fontSize: theme.font(32),
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
    },
    pageSubtitle: {
      fontSize: theme.font(14),
      color: c.muted,
      marginTop: theme.space(6),
      marginBottom: theme.space(20),
      lineHeight: theme.font(20),
    },
    card: {
      backgroundColor: c.card,
      borderRadius: theme.space(12),
      borderWidth: 1,
      borderColor: c.border,
      padding: theme.space(20),
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(16),
    },
    cardTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: theme.font(18),
      fontWeight: '700',
      color: c.text,
    },
    email: {
      fontSize: theme.font(14),
      color: c.muted,
      marginTop: theme.space(4),
    },
  });
}
