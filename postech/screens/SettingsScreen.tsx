import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SidebarLayout, APP_HEADER_PURPLE } from '@/components/SidebarLayout';
import { PersonalizationForm } from '@/components/PersonalizationPanel';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';

export function SettingsScreen() {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SidebarLayout
      activeNavKey="settings"
      desktopTopBarLeft="empty"
      searchConfig={null}
      topBarRight={null}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: APP_HEADER_PURPLE }]}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="settings-outline" size={theme.icon(26)} color={APP_HEADER_PURPLE} />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Personalização</Text>
            <Text style={styles.heroSubtitle}>Ajuste a plataforma do seu jeito</Text>
          </View>
        </View>

        <PersonalizationForm />
      </ScrollView>
    </SidebarLayout>
  );
}

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: c.bgPage,
    },
    scrollContent: {
      paddingHorizontal: theme.space(16),
      paddingBottom: theme.space(32),
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(14),
      borderRadius: theme.space(14),
      paddingVertical: theme.space(18),
      paddingHorizontal: theme.space(18),
      marginBottom: theme.space(20),
      marginTop: theme.space(4),
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 2px 8px rgba(75,0,224,0.2)' }
        : {
            shadowColor: '#4b00e0',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
          }),
    },
    heroIconWrap: {
      width: theme.space(48),
      height: theme.space(48),
      borderRadius: theme.space(10),
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTextCol: {
      flex: 1,
      minWidth: 0,
    },
    heroTitle: {
      fontSize: theme.font(18),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    heroSubtitle: {
      marginTop: theme.space(4),
      fontSize: theme.font(14),
      color: 'rgba(255,255,255,0.92)',
      lineHeight: theme.font(20),
    },
  });
}
