import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SidebarLayout } from '@/components/SidebarLayout';
import { PersonalizationForm } from '@/components/PersonalizationPanel';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';
import { useAuth } from '@/context/AuthContext';

export function SettingsScreen() {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { signOutUser } = useAuth();

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    router.replace('/login');
  }, [router, signOutUser]);

  return (
    <SidebarLayout
      activeNavKey="settings"
      desktopTopBarLeft="empty"
      onSignOut={handleSignOut}
      searchConfig={null}
      topBarRight={null}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Configuração</Text>
        <Text style={styles.pageSubtitle}>Personalização da interface</Text>

        <View style={styles.sectionCard}>
          <PersonalizationForm />
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
    sectionCard: {
      backgroundColor: c.card,
      borderRadius: theme.space(12),
      borderWidth: 1,
      borderColor: c.border,
      padding: theme.space(20),
    },
  });
}
