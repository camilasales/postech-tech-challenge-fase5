import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SidebarLayout, SIDEBAR_BREAKPOINT } from '@/components/SidebarLayout';
import { ReminderFormModal } from '@/components/ReminderFormModal';
import { useRemindersContext } from '@/context/RemindersContext';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';
import { Reminder, ReminderStatusFilter } from '@/types/reminder';
import { FlashList } from '@shopify/flash-list';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { patchReminderCompleted } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export function TaskListScreen() {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createTaskListStyles(theme), [theme]);
  const c = theme.colors;

  const router = useRouter();
  const { signOutUser } = useAuth();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReminderStatusFilter>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchSubject = useMemo(() => new Subject<string>(), []);

  useEffect(() => {
    const subscription = searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((text) => setDebouncedSearch(text));
    return () => subscription.unsubscribe();
  }, [searchSubject]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    searchSubject.next(text);
  };

  const { reminders, summary, error: contextError, refetch } = useRemindersContext();

  useEffect(() => {
    if (params.refresh) {
      const timer = setTimeout(() => {
        refetch();
        router.setParams({ refresh: undefined });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [params.refresh, refetch, router]);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await patchReminderCompleted(id, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const filteredList = useMemo(() => {
    let list = reminders;
    if (statusFilter === 'pending') list = list.filter((r) => !r.completed);
    if (statusFilter === 'completed') list = list.filter((r) => r.completed);
    const q = debouncedSearch.trim().toLowerCase();
    if (q) list = list.filter((r) => r.description.toLowerCase().includes(q));
    return list;
  }, [reminders, statusFilter, debouncedSearch]);

  const formatDateLabel = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return { text: 'Hoje', highlight: false };
    if (d.toDateString() === tomorrow.toDateString())
      return { text: 'Amanhã', highlight: true };
    return {
      text: new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d),
      highlight: false,
    };
  };

  const formatTimeOnly = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);

  const applyFilters = () => setShowFilters(false);

  const clearFilters = () => {
    setStatusFilter('all');
    setShowFilters(false);
  };

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    searchSubject.next('');
  }, [searchSubject]);

  const openReminderModal = useCallback((id?: string | null) => {
    setEditingReminderId(id ?? null);
    setShowReminderModal(true);
  }, []);

  const closeReminderModal = useCallback(() => {
    setShowReminderModal(false);
    setEditingReminderId(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Reminder }) => {
      const dateInfo = formatDateLabel(item.scheduledAt);
      const tag = item.tag ?? { name: 'Geral', color: '#8B5CF6' };

      return (
        <View style={[styles.taskCard, item.completed && styles.taskCardDone]}>
          <TouchableOpacity
            style={styles.checkboxTouch}
            onPress={() => toggleMutation.mutate({ id: item.id, completed: !item.completed })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed ? (
                <Ionicons name="checkmark" size={theme.icon(16)} color="#fff" />
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={styles.taskMain}>
            <Text
              style={[styles.taskTitle, item.completed && styles.taskTitleDone]}
              numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={theme.icon(14)} color={c.muted} />
                <Text
                  style={[
                    styles.metaText,
                    dateInfo.highlight && !item.completed && styles.metaTextHighlight,
                  ]}>
                  {dateInfo.text}
                </Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaTextMuted}>{formatTimeOnly(item.scheduledAt)}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="chatbubble-outline" size={theme.icon(14)} color={c.muted} />
                <Text style={styles.metaTextMuted}>{item.commentCount}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="attach-outline" size={theme.icon(14)} color={c.muted} />
                <Text style={styles.metaTextMuted}>{item.attachmentCount}</Text>
              </View>

              <View style={styles.tagPill}>
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={styles.tagName} numberOfLines={1}>
                  {tag.name}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => openReminderModal(item.id)}
            hitSlop={12}>
            <Ionicons name="create-outline" size={theme.icon(20)} color={c.muted} />
          </TouchableOpacity>
        </View>
      );
    },
    [toggleMutation, openReminderModal, styles, theme, c.muted]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={theme.icon(56)} color={c.border} />
      <Text style={styles.emptyTitle}>Nenhuma tarefa</Text>
      <Text style={styles.emptySub}>
        Crie uma nova tarefa ou ajuste os filtros e a busca.
      </Text>
    </View>
  );

  const showFab = Platform.OS !== 'web' || windowWidth < SIDEBAR_BREAKPOINT;

  const searchConfig = {
    value: searchText,
    onChangeText: handleSearchChange,
    onClear: handleClearSearch,
    mobilePlaceholder: 'Buscar tarefas...',
  };

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    router.replace('/login');
  }, [router, signOutUser]);

  return (
    <SidebarLayout
      activeNavKey="tasks"
      desktopTopBarLeft="empty"
      onSignOut={handleSignOut}
      searchConfig={searchConfig}
      topBarRight={
        <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.iconBtn}>
          <Ionicons name="funnel-outline" size={theme.icon(24)} color={c.text} />
        </TouchableOpacity>
      }
      postContent={
        <>
          {showFab ? (
            <TouchableOpacity
              style={[
                styles.fab,
                {
                  bottom:
                    Platform.OS === 'ios' || Platform.OS === 'android'
                      ? Math.max(insets.bottom, 16) + 8
                      : 24,
                },
              ]}
              onPress={() => openReminderModal()}
              activeOpacity={0.9}>
              <Ionicons name="add" size={theme.icon(28)} color="#fff" />
            </TouchableOpacity>
          ) : null}

          <ReminderFormModal
            visible={showReminderModal}
            reminderId={editingReminderId}
            onClose={closeReminderModal}
          />

          <Modal
            visible={showFilters}
            animationType="slide"
            transparent
            onRequestClose={() => setShowFilters(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filtros</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <Ionicons name="close" size={theme.icon(26)} color={c.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.filterLabel}>Status</Text>
                  <View style={styles.filterChips}>
                    {(
                      [
                        ['all', 'Todos'],
                        ['pending', 'Pendentes'],
                        ['completed', 'Concluídos'],
                      ] as const
                    ).map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.chip, statusFilter === key && styles.chipActive]}
                        onPress={() => setStatusFilter(key)}>
                        <Text style={[styles.chipText, statusFilter === key && styles.chipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.modalBtnGhost} onPress={clearFilters}>
                    <Text style={styles.modalBtnGhostText}>Limpar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalBtnPrimary} onPress={applyFilters}>
                    <Text style={styles.modalBtnPrimaryText}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {toggleMutation.isPending ? (
            <View style={styles.inlineLoading} pointerEvents="none">
              <ActivityIndicator size="small" color={c.blue} />
            </View>
          ) : null}
        </>
      }>
      <View style={styles.mainInner}>
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>To-Do</Text>
          <Text style={styles.pageSubtitle}>
            {summary.total} {summary.total === 1 ? 'tarefa' : 'tarefas'} · {summary.pending}{' '}
            pendentes · {summary.completed} concluídas
            {summary.dueTodayPending > 0
              ? ` · ${summary.dueTodayPending} para hoje`
              : ''}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => openReminderModal()}
            activeOpacity={0.85}>
            <Ionicons name="add" size={theme.icon(20)} color="#fff" />
            <Text style={styles.btnPrimaryText}>Nova tarefa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowFilters(true)}>
            <Ionicons name="funnel-outline" size={theme.icon(18)} color={c.text} />
            <Text style={styles.btnSecondaryText}>Filtros</Text>
          </TouchableOpacity>
        </View>

        {contextError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={theme.icon(22)} color={c.errorBannerText} />
            <Text style={styles.errorBannerText}>{contextError}</Text>
          </View>
        ) : null}

        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Lista</Text>
          <Text style={styles.listHeaderCount}>
            {filteredList.length} {filteredList.length === 1 ? 'item' : 'itens'}
          </Text>
        </View>

        <View style={styles.listWrap}>
          <FlashList
            data={filteredList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </SidebarLayout>
  );
}

function createTaskListStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    mainInner: {
      flex: 1,
    },
    iconBtn: {
      padding: theme.space(6),
    },
    titleBlock: {
      marginBottom: theme.space(16),
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
      lineHeight: theme.font(20),
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space(12),
      marginBottom: theme.space(16),
    },
    btnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(8),
      backgroundColor: c.blue,
      paddingVertical: theme.space(12),
      paddingHorizontal: theme.space(18),
      borderRadius: theme.space(8),
    },
    btnPrimaryText: {
      color: '#fff',
      fontSize: theme.font(15),
      fontWeight: '600',
    },
    btnSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(8),
      backgroundColor: c.card,
      paddingVertical: theme.space(12),
      paddingHorizontal: theme.space(18),
      borderRadius: theme.space(8),
      borderWidth: 1,
      borderColor: c.border,
    },
    btnSecondaryText: {
      color: c.text,
      fontSize: theme.font(15),
      fontWeight: '600',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(10),
      backgroundColor: c.errorBannerBg,
      padding: theme.space(12),
      borderRadius: theme.space(8),
      marginBottom: theme.space(12),
      borderWidth: 1,
      borderColor: c.errorBannerBorder,
    },
    errorBannerText: {
      flex: 1,
      fontSize: theme.font(13),
      color: c.errorBannerText,
    },
    listHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: theme.space(12),
    },
    listHeaderTitle: {
      fontSize: theme.font(18),
      fontWeight: '700',
      color: c.text,
    },
    listHeaderCount: {
      fontSize: theme.font(13),
      color: c.muted,
    },
    listWrap: {
      flex: 1,
      minHeight: theme.space(120),
    },
    listContent: {
      paddingBottom: theme.space(96),
    },
    taskCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: c.card,
      borderRadius: theme.space(12),
      borderWidth: 1,
      borderColor: c.border,
      padding: theme.space(16),
      marginBottom: theme.space(12),
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }),
    },
    taskCardDone: {
      backgroundColor: c.cardDone,
      borderColor: c.taskCardDoneBorder,
    },
    checkboxTouch: {
      marginRight: theme.space(14),
      marginTop: theme.space(2),
    },
    checkbox: {
      width: theme.icon(22),
      height: theme.icon(22),
      borderRadius: theme.space(6),
      borderWidth: 2,
      borderColor: c.checkboxBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
    },
    checkboxChecked: {
      backgroundColor: c.blue,
      borderColor: c.blue,
    },
    taskMain: {
      flex: 1,
      minWidth: 0,
    },
    taskTitle: {
      fontSize: theme.font(16),
      fontWeight: '600',
      color: c.text,
      marginBottom: theme.space(10),
      lineHeight: theme.font(22),
    },
    taskTitleDone: {
      color: c.muted,
      textDecorationLine: 'line-through',
      fontWeight: '500',
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.space(14),
      rowGap: theme.space(8),
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(4),
    },
    metaText: {
      fontSize: theme.font(13),
      color: c.text,
      fontWeight: '500',
    },
    metaTextHighlight: {
      color: c.tomorrow,
      fontWeight: '600',
    },
    metaDot: {
      fontSize: theme.font(13),
      color: c.muted,
      marginHorizontal: theme.space(2),
    },
    metaTextMuted: {
      fontSize: theme.font(13),
      color: c.muted,
    },
    tagPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(6),
      maxWidth: theme.space(140),
    },
    tagDot: {
      width: theme.space(8),
      height: theme.space(8),
      borderRadius: theme.space(4),
    },
    tagName: {
      fontSize: theme.font(13),
      color: c.muted,
      fontWeight: '500',
      flexShrink: 1,
    },
    editIconBtn: {
      padding: theme.space(4),
      marginLeft: theme.space(4),
      marginTop: -2,
    },
    fab: {
      position: 'absolute',
      right: theme.space(20),
      width: theme.space(56),
      height: theme.space(56),
      borderRadius: theme.space(28),
      backgroundColor: c.blue,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      zIndex: 50,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.space(48),
      paddingHorizontal: theme.space(24),
    },
    emptyTitle: {
      fontSize: theme.font(17),
      fontWeight: '600',
      color: c.muted,
      marginTop: theme.space(16),
    },
    emptySub: {
      fontSize: theme.font(14),
      color: c.emptySub,
      textAlign: 'center',
      marginTop: theme.space(8),
      lineHeight: theme.font(20),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: c.card,
      borderTopLeftRadius: theme.space(16),
      borderTopRightRadius: theme.space(16),
      paddingBottom: theme.space(24),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.space(20),
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    modalTitle: {
      fontSize: theme.font(18),
      fontWeight: '700',
      color: c.text,
    },
    modalBody: {
      padding: theme.space(20),
    },
    filterLabel: {
      fontSize: theme.font(14),
      fontWeight: '600',
      color: c.text,
      marginBottom: theme.space(12),
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space(10),
    },
    chip: {
      paddingVertical: theme.space(10),
      paddingHorizontal: theme.space(16),
      borderRadius: theme.space(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgPage,
    },
    chipActive: {
      borderColor: c.blue,
      backgroundColor: c.chipActiveBg,
    },
    chipText: {
      fontSize: theme.font(14),
      fontWeight: '600',
      color: c.muted,
    },
    chipTextActive: {
      color: c.blue,
    },
    modalFooter: {
      flexDirection: 'row',
      paddingHorizontal: theme.space(20),
      gap: theme.space(12),
    },
    modalBtnGhost: {
      flex: 1,
      paddingVertical: theme.space(14),
      borderRadius: theme.space(8),
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    modalBtnGhostText: {
      fontSize: theme.font(15),
      fontWeight: '600',
      color: c.muted,
    },
    modalBtnPrimary: {
      flex: 1,
      paddingVertical: theme.space(14),
      borderRadius: theme.space(8),
      backgroundColor: c.blue,
      alignItems: 'center',
    },
    modalBtnPrimaryText: {
      fontSize: theme.font(15),
      fontWeight: '600',
      color: '#fff',
    },
    inlineLoading: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.overlayLoading,
    },
  });
}
