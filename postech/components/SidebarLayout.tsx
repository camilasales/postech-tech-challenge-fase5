import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  useWindowDimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';

export const SIDEBAR_BREAKPOINT = 900;

const SIDEBAR_W = 248;

export type SidebarNavKey = 'tasks' | 'profile' | 'settings';

type NavItem = {
  key: SidebarNavKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/' | '/profile' | '/settings';
};

const NAV_ITEMS: NavItem[] = [
  { key: 'tasks', label: 'Tarefas', icon: 'checkbox-outline', href: '/' },
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
};

export function SidebarLayout({
  children,
  activeNavKey,
  searchConfig,
  topBarRight,
  desktopTopBarLeft,
  postContent,
  onSignOut,
}: SidebarLayoutProps) {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const c = theme.colors;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const showDesktopSidebar = Platform.OS === 'web' && windowWidth >= SIDEBAR_BREAKPOINT;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const onNavPress = useCallback(
    (item: NavItem) => {
      router.push(item.href);
      setMobileMenuOpen(false);
    },
    [router]
  );

  const renderSidebarBody = (opts: { onNavigate?: () => void }) => (
    <>
      {searchConfig ? (
        <View style={styles.sidebarSearchRow}>
          <Ionicons
            name="search-outline"
            size={theme.icon(18)}
            color={c.muted}
            style={styles.sidebarSearchIcon}
          />
          <TextInput
            style={styles.sidebarSearchInput}
            placeholder="Buscar..."
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

      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeNavKey;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navRow, active && styles.navRowActive]}
              onPress={() => {
                onNavPress(item);
                opts.onNavigate?.();
              }}
              activeOpacity={0.7}>
              <Ionicons
                name={item.icon}
                size={theme.icon(20)}
                color={active ? c.blue : c.muted}
                style={styles.navIcon}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
        {onSignOut ? (
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              void onSignOut();
              opts.onNavigate?.();
            }}
            activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={theme.icon(20)} color={c.muted} style={styles.navIcon} />
            <Text style={styles.navLabel}>Sair</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bgPage} />

      <View style={[styles.shell, { paddingTop: Platform.OS === 'ios' ? 0 : Math.max(insets.top, theme.space(8)) }]}>
        {showDesktopSidebar && !sidebarCollapsed ? (
          <View style={[styles.sidebar, { width: SIDEBAR_W }]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarBrand}>ByteTasks</Text>
              <TouchableOpacity
                onPress={() => setSidebarCollapsed(true)}
                hitSlop={10}
                style={styles.collapseBtn}>
                <Ionicons name="chevron-back" size={theme.icon(22)} color={c.muted} />
              </TouchableOpacity>
            </View>
            {renderSidebarBody({})}
          </View>
        ) : null}

        {showDesktopSidebar && sidebarCollapsed ? (
          <View style={styles.sidebarRail}>
            <TouchableOpacity
              onPress={() => setSidebarCollapsed(false)}
              style={styles.railExpand}
              hitSlop={8}>
              <Ionicons name="chevron-forward" size={theme.icon(22)} color={c.muted} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.main}>
          <View style={styles.mainTopBar}>
            {!showDesktopSidebar ? (
              <TouchableOpacity onPress={() => setMobileMenuOpen(true)} style={styles.iconBtn}>
                <Ionicons name="menu-outline" size={theme.icon(26)} color={c.text} />
              </TouchableOpacity>
            ) : desktopTopBarLeft === 'back' ? (
              <TouchableOpacity onPress={() => router.push('/')} style={styles.iconBtn}>
                <Ionicons name="arrow-back-outline" size={theme.icon(24)} color={c.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.topBarLeftSpacer} />
            )}
            <View style={styles.mainTopBarRight}>{topBarRight ?? null}</View>
          </View>

          {searchConfig && !showDesktopSidebar ? (
            <View style={styles.mobileSearch}>
              <Ionicons name="search-outline" size={theme.icon(18)} color={c.muted} />
              <TextInput
                style={styles.mobileSearchInput}
                placeholder={searchConfig.mobilePlaceholder ?? 'Buscar...'}
                placeholderTextColor={c.placeholder}
                value={searchConfig.value}
                onChangeText={searchConfig.onChangeText}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchConfig.value.length > 0 ? (
                <TouchableOpacity onPress={searchConfig.onClear}>
                  <Ionicons name="close-circle" size={theme.icon(18)} color={c.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {children}
        </View>
      </View>

      {postContent}

      <Modal
        visible={mobileMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setMobileMenuOpen(false)}>
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerScrim} onPress={() => setMobileMenuOpen(false)} />
          <View style={[styles.drawerPanel, { paddingTop: insets.top + theme.space(12) }]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setMobileMenuOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={theme.icon(26)} color={c.text} />
              </TouchableOpacity>
            </View>
            {renderSidebarBody({ onNavigate: () => setMobileMenuOpen(false) })}
          </View>
        </View>
      </Modal>
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
      flexDirection: 'row',
    },
    sidebar: {
      backgroundColor: c.card,
      borderRightWidth: 1,
      borderRightColor: c.border,
      paddingHorizontal: theme.space(16),
      paddingBottom: theme.space(16),
    },
    sidebarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.space(16),
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: theme.space(12),
    },
    sidebarBrand: {
      fontSize: theme.font(17),
      fontWeight: '700',
      color: c.text,
    },
    collapseBtn: {
      padding: theme.space(4),
    },
    sidebarSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.space(8),
      paddingHorizontal: theme.space(10),
      paddingVertical: theme.space(8),
      marginBottom: theme.space(16),
      backgroundColor: c.bgPage,
    },
    sidebarSearchIcon: {
      marginRight: theme.space(8),
    },
    sidebarSearchInput: {
      flex: 1,
      fontSize: theme.font(14),
      color: c.text,
      paddingVertical: theme.space(4),
    },
    navScroll: {
      flexGrow: 0,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.space(12),
      paddingHorizontal: theme.space(10),
      borderRadius: theme.space(8),
      marginBottom: theme.space(4),
    },
    navRowActive: {
      backgroundColor: c.navActiveBg,
    },
    navIcon: {
      marginRight: theme.space(12),
      width: theme.space(24),
    },
    navLabel: {
      flex: 1,
      fontSize: theme.font(15),
      color: c.muted,
      fontWeight: '500',
    },
    navLabelActive: {
      color: c.blue,
      fontWeight: '600',
    },
    sidebarRail: {
      width: theme.space(44),
      backgroundColor: c.card,
      borderRightWidth: 1,
      borderRightColor: c.border,
      alignItems: 'center',
      paddingTop: theme.space(16),
    },
    railExpand: {
      padding: theme.space(8),
    },
    main: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: theme.space(20),
      paddingBottom: theme.space(16),
    },
    mainTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.space(8),
    },
    topBarLeftSpacer: {
      width: theme.space(38),
      height: theme.space(38),
    },
    mainTopBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(4),
    },
    iconBtn: {
      padding: theme.space(6),
    },
    mobileSearch: {
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
    mobileSearchInput: {
      flex: 1,
      fontSize: theme.font(15),
      color: c.text,
    },
    drawerOverlay: {
      flex: 1,
      flexDirection: 'row',
    },
    drawerScrim: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    drawerPanel: {
      width: Math.min(SIDEBAR_W + theme.space(24), 300),
      maxWidth: '85%',
      backgroundColor: c.card,
      paddingHorizontal: theme.space(16),
      paddingBottom: theme.space(24),
      borderRightWidth: 1,
      borderRightColor: c.border,
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.space(16),
    },
    drawerTitle: {
      fontSize: theme.font(20),
      fontWeight: '700',
      color: c.text,
    },
  });
}
