import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';

export const APP_HEADER_PURPLE = '#4B00E0';

export const SIDEBAR_BREAKPOINT = 900;

export function getBottomNavHeight(theme: AppTheme, extraBottomInset = 0): number {
  const row =
    theme.space(8) + theme.icon(24) + theme.space(4) + theme.font(11) + theme.space(8) + 3;
  return row + Math.max(theme.space(6), extraBottomInset);
}

export type SidebarNavKey = 'home' | 'tasks' | 'profile' | 'settings';

type NavItem = {
  key: SidebarNavKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/' | '/tasks' | '/profile' | '/settings';
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Início', icon: 'home-outline', href: '/' },
  { key: 'tasks', label: 'Tarefas', icon: 'checkbox-outline', href: '/tasks' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', href: '/profile' },
  { key: 'settings', label: 'Configuração', icon: 'settings-outline', href: '/settings' },
];

export type SidebarLayoutSearchConfig = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  mobilePlaceholder?: string;
};

type SidebarLayoutProps = {
  children: React.ReactNode;
  activeNavKey: SidebarNavKey;
  searchConfig: SidebarLayoutSearchConfig | null;
  topBarRight?: React.ReactNode;
  desktopTopBarLeft: 'back' | 'empty';
  postContent?: React.ReactNode;
  onSignOut?: () => void | Promise<void>;
  mainVariant?: 'standard' | 'flush';
  statusBarStyle?: 'light-content' | 'dark-content';
  statusBarBackgroundColor?: string;
  safeAreaBackgroundColor?: string;
};

export function SidebarLayout({
  children,
  activeNavKey,
  searchConfig,
  topBarRight,
  desktopTopBarLeft,
  postContent,
  onSignOut,
  mainVariant = 'standard',
  statusBarStyle = 'light-content',
  statusBarBackgroundColor,
  safeAreaBackgroundColor,
}: SidebarLayoutProps) {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const c = theme.colors;

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onNavPress = useCallback(
    (item: NavItem) => {
      router.push(item.href);
    },
    [router]
  );

  const statusBg = statusBarBackgroundColor ?? APP_HEADER_PURPLE;
  const safeBg = safeAreaBackgroundColor ?? APP_HEADER_PURPLE;

  const showToolBar =
    mainVariant === 'standard' && (desktopTopBarLeft === 'back' || topBarRight != null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: safeBg }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBg} />

      <View style={[styles.shell, { paddingTop: Platform.OS === 'ios' ? 0 : Math.max(insets.top, theme.space(8)) }]}>
        <View style={styles.appHeroHeader}>
          <Text style={styles.appHeroTitle}>SeniorEase</Text>
          <Text style={styles.appHeroSubtitle}>Plataforma de Inclusão Digital</Text>
        </View>

        <View style={[styles.mainColumn, { backgroundColor: c.bgPage }]}>
          <View style={[styles.main, mainVariant === 'flush' && styles.mainFlush]}>
            {showToolBar ? (
              <View style={styles.mainTopBar}>
                {desktopTopBarLeft === 'back' ? (
                  <TouchableOpacity onPress={() => router.push('/')} style={styles.iconBtn}>
                    <Ionicons name="arrow-back-outline" size={theme.icon(24)} color={c.text} />
                  </TouchableOpacity>
                ) : null}
                <View style={styles.mainTopBarSpacer} />
                <View style={styles.mainTopBarRight}>{topBarRight ?? null}</View>
              </View>
            ) : null}

            {mainVariant === 'standard' && searchConfig ? (
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={theme.icon(18)} color={c.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchConfig.mobilePlaceholder ?? 'Buscar...'}
                  placeholderTextColor={c.placeholder}
                  value={searchConfig.value}
                  onChangeText={searchConfig.onChangeText}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchConfig.value.length > 0 ? (
                  <TouchableOpacity onPress={searchConfig.onClear} hitSlop={12}>
                    <Ionicons name="close-circle" size={theme.icon(18)} color={c.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {children}
          </View>
        </View>

        <View
          style={[
            styles.bottomNav,
            {
              paddingBottom:
                Platform.OS === 'android'
                  ? Math.max(insets.bottom, theme.space(6))
                  : theme.space(6),
            },
          ]}>
          <View style={styles.bottomNavRow}>
            {NAV_ITEMS.map((item) => {
              const active = item.key === activeNavKey;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}
                  onPress={() => onNavPress(item)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={item.icon}
                    size={theme.icon(24)}
                    color={active ? c.navAccent : c.navInactive}
                  />
                  <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {onSignOut ? (
              <TouchableOpacity
                style={styles.bottomNavItem}
                onPress={() => void onSignOut()}
                activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={theme.icon(24)} color={c.navInactive} />
                <Text style={styles.bottomNavLabel} numberOfLines={1}>
                  Sair
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {postContent}
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bgPage,
    },
    shell: {
      flex: 1,
      flexDirection: 'column',
    },
    appHeroHeader: {
      backgroundColor: APP_HEADER_PURPLE,
      paddingHorizontal: theme.space(20),
      paddingTop: theme.space(12),
      paddingBottom: theme.space(20),
    },
    appHeroTitle: {
      fontSize: theme.font(28),
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    appHeroSubtitle: {
      marginTop: theme.space(6),
      fontSize: theme.font(16),
      color: 'rgba(255,255,255,0.92)',
      fontWeight: '500',
    },
    mainColumn: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    },
    main: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      paddingHorizontal: theme.space(20),
      paddingBottom: theme.space(16),
    },
    mainFlush: {
      paddingHorizontal: 0,
    },
    mainTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.space(8),
    },
    mainTopBarSpacer: {
      flex: 1,
      minWidth: 0,
    },
    mainTopBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(4),
    },
    iconBtn: {
      padding: theme.space(6),
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(10),
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.space(8),
      paddingHorizontal: theme.space(12),
      paddingVertical: theme.space(10),
      marginBottom: theme.space(16),
      backgroundColor: c.card,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.font(15),
      color: c.text,
    },
    bottomNav: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.card,
    },
    bottomNavRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    bottomNavItem: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: theme.space(8),
      paddingBottom: theme.space(8),
      paddingHorizontal: theme.space(2),
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
      backgroundColor: 'transparent',
    },
    bottomNavItemActive: {
      backgroundColor: c.navActiveBg,
      borderBottomColor: c.navAccent,
    },
    bottomNavLabel: {
      marginTop: theme.space(4),
      fontSize: theme.font(10),
      color: c.navInactive,
      fontWeight: '700',
      textAlign: 'center',
    },
    bottomNavLabelActive: {
      color: c.navAccent,
    },
  });
}
