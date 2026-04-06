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
import { Reminder, ReminderStatusFilter } from '@/types/reminder';
import { FlashList } from '@shopify/flash-list';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { patchReminderCompleted } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const BLUE = '#2563EB';
const BORDER = '#E5E7EB';
const BG_PAGE = '#F9FAFB';
const CARD = '#FFFFFF';
const CARD_DONE = '#F3F4F6';
const TEXT = '#111827';
const MUTED = '#6B7280';
const TOMORROW = '#EA580C';

export function TaskListScreen() {
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
              {item.completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
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
                <Ionicons name="calendar-outline" size={14} color={MUTED} />
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
                <Ionicons name="chatbubble-outline" size={14} color={MUTED} />
                <Text style={styles.metaTextMuted}>{item.commentCount}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="attach-outline" size={14} color={MUTED} />
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
            <Ionicons name="create-outline" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>
      );
    },
    [toggleMutation, openReminderModal]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={56} color="#D1D5DB" />
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
          <Ionicons name="options-outline" size={24} color={TEXT} />
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
              <Ionicons name="add" size={28} color="#fff" />
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
                    <Ionicons name="close" size={26} color={TEXT} />
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
              <ActivityIndicator size="small" color={BLUE} />
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
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.btnPrimaryText}>Nova tarefa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowFilters(true)}>
            <Ionicons name="funnel-outline" size={18} color={TEXT} />
            <Text style={styles.btnSecondaryText}>Filtros</Text>
          </TouchableOpacity>
        </View>

        {contextError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={22} color="#B45309" />
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

const styles = StyleSheet.create({
  mainInner: {
    flex: 1,
  },
  iconBtn: {
    padding: 6,
  },
  titleBlock: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: MUTED,
    marginTop: 6,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BLUE,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARD,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  btnSecondaryText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
  },
  listHeaderCount: {
    fontSize: 13,
    color: MUTED,
  },
  listWrap: {
    flex: 1,
    minHeight: 120,
  },
  listContent: {
    paddingBottom: 96,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: CARD_DONE,
    borderColor: '#E5E7EB',
  },
  checkboxTouch: {
    marginRight: 14,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
  },
  checkboxChecked: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  taskMain: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 10,
    lineHeight: 22,
  },
  taskTitleDone: {
    color: MUTED,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    rowGap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: TEXT,
    fontWeight: '500',
  },
  metaTextHighlight: {
    color: TOMORROW,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 13,
    color: MUTED,
    marginHorizontal: 2,
  },
  metaTextMuted: {
    fontSize: 13,
    color: MUTED,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 140,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagName: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
    flexShrink: 1,
  },
  editIconBtn: {
    padding: 4,
    marginLeft: 4,
    marginTop: -2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BLUE,
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
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: MUTED,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CARD,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
  },
  modalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG_PAGE,
  },
  chipActive: {
    borderColor: BLUE,
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
  },
  chipTextActive: {
    color: BLUE,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalBtnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  modalBtnGhostText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  inlineLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249,250,251,0.5)',
  },
});
