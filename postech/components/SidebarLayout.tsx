import React, { useState, useCallback } from 'react';
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

export const SIDEBAR_BREAKPOINT = 900;

const BLUE = '#2563EB';
const BORDER = '#E5E7EB';
const BG_PAGE = '#F9FAFB';
const CARD = '#FFFFFF';
const TEXT = '#111827';
const MUTED = '#6B7280';
const SIDEBAR_W = 248;

type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: '/';
  soon?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'tasks', label: 'Tarefas', icon: 'checkbox-outline', href: '/' },
  { key: 'people', label: 'Pessoas', icon: 'people-outline', soon: true },
  { key: 'reports', label: 'Relatórios', icon: 'bar-chart-outline', soon: true },
  { key: 'billing', label: 'Cobrança', icon: 'card-outline', soon: true },
  { key: 'integrations', label: 'Integrações', icon: 'extension-puzzle-outline', soon: true },
];

export type SidebarLayoutSearchConfig = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  mobilePlaceholder?: string;
};

type SidebarLayoutProps = {
  children: React.ReactNode;
  activeNavKey: 'tasks';
  searchConfig: SidebarLayoutSearchConfig | null;
  topBarRight?: React.ReactNode;
  /** Em desktop: seta voltar (telas secundárias) ou área vazia (tela principal). */
  desktopTopBarLeft: 'back' | 'empty';
  /** FAB, modais extras, etc. (renderizado após o shell, dentro do SafeAreaView). */
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const showDesktopSidebar = Platform.OS === 'web' && windowWidth >= SIDEBAR_BREAKPOINT;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const onNavPress = useCallback(
    (item: NavItem) => {
      if (item.soon) return;
      if (item.href === '/') router.push('/');
      setMobileMenuOpen(false);
    },
    [router]
  );

  const renderSidebarBody = (opts: { onNavigate?: () => void }) => (
    <>
      {searchConfig ? (
        <View style={styles.sidebarSearchRow}>
          <Ionicons name="search-outline" size={18} color={MUTED} style={styles.sidebarSearchIcon} />
          <TextInput
            style={styles.sidebarSearchInput}
            placeholder="Buscar..."
            placeholderTextColor="#9CA3AF"
            value={searchConfig.value}
            onChangeText={searchConfig.onChangeText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchConfig.value.length > 0 ? (
            <TouchableOpacity onPress={searchConfig.onClear} hitSlop={12}>
              <Ionicons name="close-circle" size={18} color={MUTED} />
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
                size={20}
                color={active ? BLUE : MUTED}
                style={styles.navIcon}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              {item.soon ? <Text style={styles.navSoon}>em breve</Text> : null}
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
            <Ionicons name="log-out-outline" size={20} color={MUTED} style={styles.navIcon} />
            <Text style={styles.navLabel}>Sair</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_PAGE} />

      <View style={[styles.shell, { paddingTop: Platform.OS === 'ios' ? 0 : Math.max(insets.top, 8) }]}>
        {showDesktopSidebar && !sidebarCollapsed ? (
          <View style={[styles.sidebar, { width: SIDEBAR_W }]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarBrand}>ByteTasks</Text>
              <TouchableOpacity
                onPress={() => setSidebarCollapsed(true)}
                hitSlop={10}
                style={styles.collapseBtn}>
                <Ionicons name="chevron-back" size={22} color={MUTED} />
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
              <Ionicons name="chevron-forward" size={22} color={MUTED} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.main}>
          <View style={styles.mainTopBar}>
            {!showDesktopSidebar ? (
              <TouchableOpacity onPress={() => setMobileMenuOpen(true)} style={styles.iconBtn}>
                <Ionicons name="menu-outline" size={26} color={TEXT} />
              </TouchableOpacity>
            ) : desktopTopBarLeft === 'back' ? (
              <TouchableOpacity onPress={() => router.push('/')} style={styles.iconBtn}>
                <Ionicons name="arrow-back-outline" size={24} color={TEXT} />
              </TouchableOpacity>
            ) : (
              <View style={styles.topBarLeftSpacer} />
            )}
            <View style={styles.mainTopBarRight}>{topBarRight ?? null}</View>
          </View>

          {searchConfig && !showDesktopSidebar ? (
            <View style={styles.mobileSearch}>
              <Ionicons name="search-outline" size={18} color={MUTED} />
              <TextInput
                style={styles.mobileSearchInput}
                placeholder={searchConfig.mobilePlaceholder ?? 'Buscar...'}
                placeholderTextColor="#9CA3AF"
                value={searchConfig.value}
                onChangeText={searchConfig.onChangeText}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchConfig.value.length > 0 ? (
                <TouchableOpacity onPress={searchConfig.onClear}>
                  <Ionicons name="close-circle" size={18} color={MUTED} />
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
          <View style={[styles.drawerPanel, { paddingTop: insets.top + 12 }]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setMobileMenuOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={26} color={TEXT} />
              </TouchableOpacity>
            </View>
            {renderSidebarBody({ onNavigate: () => setMobileMenuOpen(false) })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_PAGE,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: CARD,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 12,
  },
  sidebarBrand: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
  },
  collapseBtn: {
    padding: 4,
  },
  sidebarSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: BG_PAGE,
  },
  sidebarSearchIcon: {
    marginRight: 8,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
    paddingVertical: 4,
  },
  navScroll: {
    flexGrow: 0,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  navRowActive: {
    backgroundColor: '#EFF6FF',
  },
  navIcon: {
    marginRight: 12,
    width: 24,
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    color: MUTED,
    fontWeight: '500',
  },
  navLabelActive: {
    color: BLUE,
    fontWeight: '600',
  },
  navSoon: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  sidebarRail: {
    width: 44,
    backgroundColor: CARD,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    alignItems: 'center',
    paddingTop: 16,
  },
  railExpand: {
    padding: 8,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  mainTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topBarLeftSpacer: {
    width: 38,
    height: 38,
  },
  mainTopBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  mobileSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: CARD,
  },
  mobileSearchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
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
    width: Math.min(SIDEBAR_W + 24, 300),
    maxWidth: '85%',
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
  },
});
