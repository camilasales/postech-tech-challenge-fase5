import React, { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SidebarLayout, APP_HEADER_PURPLE } from '@/components/SidebarLayout';
import { EditActivityForm } from '@/components/EditActivityForm';
import { AddActivityForm } from '@/components/AddActivityForm';
import { ActivitySuccessToast } from '@/components/ActivitySuccessToast';
import { useRemindersContext } from '@/context/RemindersContext';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';
import { Reminder, ReminderStatusFilter, type TaskListRow } from '@/types/reminder';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { patchReminderCompleted } from '@/services/api';
import { parseActivityDescription } from '@/utils/activityDescription';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const STAT_PENDING_BG = '#FFFBEB';
const STAT_PENDING_BORDER = '#FDBA74';
const STAT_PENDING_ACCENT = '#EA580C';
const STAT_DONE_BG = '#F0FDF4';
const STAT_DONE_BORDER = '#BBF7D0';
const STAT_DONE_ACCENT = '#16A34A';
const PRIMARY_ACTION_GREEN = '#16A34A';
const EMPTY_CARD_BG = '#FAFAFA';
const EMPTY_CARD_BORDER = '#E5E7EB';
const EMPTY_MUTED = '#6B7280';
const EMPTY_TITLE = '#374151';
const EMPTY_ICON = '#9CA3AF';
const CARD_DONE_BG = '#F0FDF4';
const CARD_DONE_BORDER = '#BBF7D0';
const CHECKBOX_PENDING_RING = '#D1D5DB';

function coerceReminderDate(value: unknown, fallback: Date): Date {
  if (value == null) return fallback;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function formatActivityDateTime(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function TaskListScreen() {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createTaskListStyles(theme), [theme]);
  const c = theme.colors;

  const router = useRouter();
  const { signOutUser } = useAuth();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReminderStatusFilter>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchSubject = useMemo(() => new Subject<string>(), []);
  const listRef = useRef<FlashListRef<TaskListRow>>(null);
  const addSectionYRef = useRef(0);

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

  const { pendingFiltered, completedFiltered } = useMemo(() => {
    let list = reminders;
    if (statusFilter === 'pending') list = list.filter((r) => !r.completed);
    if (statusFilter === 'completed') list = list.filter((r) => r.completed);
    const q = debouncedSearch.trim().toLowerCase();
    if (q) list = list.filter((r) => r.description.toLowerCase().includes(q));
    return {
      pendingFiltered: list.filter((r) => !r.completed),
      completedFiltered: list.filter((r) => r.completed),
    };
  }, [reminders, statusFilter, debouncedSearch]);

  const listData = useMemo((): TaskListRow[] => {
    const rows: TaskListRow[] = [];
    if (statusFilter !== 'completed' && pendingFiltered.length > 0) {
      rows.push({ type: 'header', id: 'section-pending', variant: 'pending' });
      for (const r of pendingFiltered) {
        rows.push({ type: 'item', id: r.id, reminder: r });
      }
    }
    if (statusFilter !== 'pending' && completedFiltered.length > 0) {
      rows.push({ type: 'header', id: 'section-completed', variant: 'completed' });
      for (const r of completedFiltered) {
        rows.push({ type: 'item', id: r.id, reminder: r });
      }
    }
    return rows;
  }, [pendingFiltered, completedFiltered, statusFilter]);

  const applyFilters = () => setShowFilters(false);

  const clearFilters = () => {
    setStatusFilter('all');
    setShowFilters(false);
  };

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    searchSubject.next('');
  }, [searchSubject]);

  const openAddForm = useCallback(() => setShowAddForm(true), []);
  const closeAddForm = useCallback(() => setShowAddForm(false), []);

  const showActivitySavedToast = useCallback(() => setShowSuccessToast(true), []);
  const dismissSuccessToast = useCallback(() => setShowSuccessToast(false), []);

  const scrollListToAddSection = useCallback(
    (y: number) => {
      const pad = theme.space(8);
      listRef.current?.scrollToOffset({
        offset: Math.max(0, y - pad),
        animated: true,
      });
    },
    [theme]
  );

  const onAddSectionLayout = useCallback(
    (e: LayoutChangeEvent) => {
      addSectionYRef.current = e.nativeEvent.layout.y;
      if (showAddForm) {
        requestAnimationFrame(() => scrollListToAddSection(addSectionYRef.current));
      }
    },
    [showAddForm, scrollListToAddSection]
  );

  useLayoutEffect(() => {
    if (!showAddForm) return;
    const id = requestAnimationFrame(() => {
      scrollListToAddSection(addSectionYRef.current);
    });
    return () => cancelAnimationFrame(id);
  }, [showAddForm, scrollListToAddSection]);

  const openEditModal = useCallback((id: string) => {
    setEditingReminderId(id);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingReminderId(null);
  }, []);

  const renderListRow = useCallback(
    ({ item }: { item: TaskListRow }) => {
      if (item.type === 'header') {
        const isCompleted = item.variant === 'completed';
        return (
          <View style={[styles.sectionHeader, isCompleted && styles.sectionHeaderAfterBlock]}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'time-outline'}
              size={theme.icon(24)}
              color={isCompleted ? STAT_DONE_ACCENT : STAT_PENDING_ACCENT}
            />
            <Text style={styles.sectionHeaderTitle}>
              {isCompleted ? 'Atividades Concluídas' : 'Atividades Pendentes'}
            </Text>
          </View>
        );
      }

      const reminder = item.reminder;
      const { title, subtitle } = parseActivityDescription(reminder.description);
      const scheduledDisplay = formatActivityDateTime(reminder.scheduledAt);
      const completedAt = coerceReminderDate(reminder.updatedAt, reminder.scheduledAt);

      return (
        <View
          style={[
            styles.activityCard,
            reminder.completed ? styles.activityCardCompleted : styles.activityCardPending,
          ]}>
          <TouchableOpacity
            style={styles.checkboxTouch}
            onPress={() =>
              toggleMutation.mutate({ id: reminder.id, completed: !reminder.completed })
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View
              style={[
                styles.activityCheckbox,
                reminder.completed ? styles.activityCheckboxDone : styles.activityCheckboxPending,
              ]}>
              {reminder.completed ? (
                <Ionicons name="checkmark" size={theme.icon(18)} color="#FFFFFF" />
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.activityMain}
            onPress={() => openEditModal(reminder.id)}
            activeOpacity={0.7}>
            <Text style={styles.activityTitle} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.activitySubtitle} numberOfLines={3}>
                {subtitle}
              </Text>
            ) : null}
            <View style={styles.activityMetaRow}>
              {reminder.completed ? (
                <>
                  <Ionicons name="checkmark-circle" size={theme.icon(16)} color={STAT_DONE_ACCENT} />
                  <Text style={styles.activityMetaCompleted}>
                    Concluído em {formatActivityDateTime(completedAt)}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={theme.icon(16)} color={EMPTY_MUTED} />
                  <Text style={styles.activityMetaPending}>{scheduledDisplay}</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => openEditModal(reminder.id)}
            hitSlop={12}
            accessibilityLabel="Editar atividade">
            <Ionicons name="create-outline" size={theme.icon(22)} color={c.muted} />
          </TouchableOpacity>
        </View>
      );
    },
    [openEditModal, styles, theme, c.muted, toggleMutation]
  );

  const renderEmptyState = useCallback(() => {
    const noTasksYet = reminders.length === 0;
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="checkbox-outline" size={theme.icon(52)} color={EMPTY_ICON} />
        <Text style={styles.emptyCardTitle}>
          {noTasksYet ? 'Nenhuma Atividade Cadastrada' : 'Nenhum resultado'}
        </Text>
        <Text style={styles.emptyCardSub}>
          {noTasksYet
            ? showAddForm
              ? 'Preencha o formulário acima para criar sua primeira atividade.'
              : 'Clique no botão acima para adicionar sua primeira atividade'
            : 'Tente ajustar os filtros ou a busca.'}
        </Text>
      </View>
    );
  }, [reminders.length, showAddForm, styles, theme]);

  const searchConfig = {
    value: searchText,
    onChangeText: handleSearchChange,
    onClear: handleClearSearch,
    mobilePlaceholder: 'Buscar atividades...',
  };

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    router.replace('/login');
  }, [router, signOutUser]);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeaderRoot}>
        <View style={[styles.tasksHero, { backgroundColor: APP_HEADER_PURPLE }]}>
          <View style={styles.tasksHeroIconWrap}>
            <Ionicons name="checkmark" size={theme.icon(26)} color={APP_HEADER_PURPLE} />
          </View>
          <View style={styles.tasksHeroTextCol}>
            <Text style={styles.tasksHeroTitle}>Minhas Atividades</Text>
            <Text style={styles.tasksHeroSubtitle}>Organize suas atividades do dia a dia</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: STAT_PENDING_BG, borderColor: STAT_PENDING_BORDER },
            ]}>
            <Ionicons name="time-outline" size={theme.icon(28)} color={STAT_PENDING_ACCENT} />
            <View style={styles.statCardTextCol}>
              <Text style={[styles.statCardNumber, { color: STAT_PENDING_ACCENT }]}>
                {summary.pending}
              </Text>
              <Text style={[styles.statCardLabel, { color: STAT_PENDING_ACCENT }]}>Pendentes</Text>
            </View>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: STAT_DONE_BG, borderColor: STAT_DONE_BORDER },
            ]}>
            <Ionicons name="checkmark-circle" size={theme.icon(28)} color={STAT_DONE_ACCENT} />
            <View style={styles.statCardTextCol}>
              <Text style={[styles.statCardNumber, { color: STAT_DONE_ACCENT }]}>
                {summary.completed}
              </Text>
              <Text style={[styles.statCardLabel, { color: STAT_DONE_ACCENT }]}>Concluídas</Text>
            </View>
          </View>
        </View>

        {contextError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={theme.icon(22)} color={c.errorBannerText} />
            <Text style={styles.errorBannerText}>{contextError}</Text>
          </View>
        ) : null}

        <View onLayout={onAddSectionLayout}>
          {showAddForm ? (
            <AddActivityForm onCancel={closeAddForm} onSaved={showActivitySavedToast} />
          ) : (
            <TouchableOpacity
              style={[styles.addActivityBtn, { backgroundColor: PRIMARY_ACTION_GREEN }]}
              onPress={openAddForm}
              activeOpacity={0.88}>
              <Text style={styles.addActivityBtnText}>+ Adicionar Nova Atividade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [
      styles,
      theme,
      summary.pending,
      summary.completed,
      contextError,
      c.errorBannerText,
      showAddForm,
      closeAddForm,
      openAddForm,
      onAddSectionLayout,
      showActivitySavedToast,
    ]
  );

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
          <ActivitySuccessToast visible={showSuccessToast} onDismiss={dismissSuccessToast} />

          <EditActivityForm
            visible={editingReminderId !== null}
            reminderId={editingReminderId}
            onClose={closeEditModal}
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
        <View style={styles.listWrap}>
          <FlashList
            ref={listRef}
            data={listData}
            renderItem={renderListRow}
            keyExtractor={(row) => row.id}
            getItemType={(row) => row.type}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            extraData={showAddForm}
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
    listHeaderRoot: {
      paddingBottom: theme.space(4),
    },
    iconBtn: {
      padding: theme.space(6),
    },
    tasksHero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(14),
      borderRadius: theme.space(14),
      paddingVertical: theme.space(18),
      paddingHorizontal: theme.space(18),
      marginBottom: theme.space(16),
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
    tasksHeroIconWrap: {
      width: theme.space(48),
      height: theme.space(48),
      borderRadius: theme.space(10),
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tasksHeroTextCol: {
      flex: 1,
      minWidth: 0,
    },
    tasksHeroTitle: {
      fontSize: theme.font(18),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    tasksHeroSubtitle: {
      marginTop: theme.space(4),
      fontSize: theme.font(14),
      color: 'rgba(255,255,255,0.92)',
      lineHeight: theme.font(20),
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.space(12),
      marginBottom: theme.space(16),
    },
    statCard: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(12),
      borderRadius: theme.space(12),
      borderWidth: 1,
      paddingVertical: theme.space(14),
      paddingHorizontal: theme.space(14),
    },
    statCardTextCol: {
      flex: 1,
      minWidth: 0,
    },
    statCardNumber: {
      fontSize: theme.font(22),
      fontWeight: '800',
    },
    statCardLabel: {
      marginTop: theme.space(2),
      fontSize: theme.font(13),
      fontWeight: '700',
    },
    addActivityBtn: {
      alignSelf: 'stretch',
      borderRadius: theme.space(14),
      paddingVertical: theme.space(16),
      paddingHorizontal: theme.space(20),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.space(20),
    },
    addActivityBtnText: {
      color: '#FFFFFF',
      fontSize: theme.font(16),
      fontWeight: '800',
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
    listWrap: {
      flex: 1,
      minHeight: theme.space(120),
    },
    listContent: {
      paddingBottom: theme.space(96),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(10),
      marginBottom: theme.space(12),
      marginTop: theme.space(4),
    },
    sectionHeaderAfterBlock: {
      marginTop: theme.space(22),
    },
    sectionHeaderTitle: {
      fontSize: theme.font(17),
      fontWeight: '800',
      color: c.text,
    },
    activityCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: theme.space(12),
      padding: theme.space(16),
      marginBottom: theme.space(12),
    },
    activityCardPending: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }),
    },
    activityCardCompleted: {
      backgroundColor: CARD_DONE_BG,
      borderWidth: 1,
      borderColor: CARD_DONE_BORDER,
    },
    checkboxTouch: {
      marginRight: theme.space(14),
      marginTop: theme.space(2),
    },
    activityCheckbox: {
      width: theme.space(28),
      height: theme.space(28),
      borderRadius: theme.space(14),
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityCheckboxPending: {
      borderWidth: 2.5,
      borderColor: CHECKBOX_PENDING_RING,
      backgroundColor: '#FFFFFF',
    },
    activityCheckboxDone: {
      backgroundColor: STAT_DONE_ACCENT,
      borderWidth: 2,
      borderColor: STAT_DONE_ACCENT,
    },
    activityMain: {
      flex: 1,
      minWidth: 0,
    },
    activityTitle: {
      fontSize: theme.font(16),
      fontWeight: '700',
      color: c.text,
      lineHeight: theme.font(22),
    },
    activitySubtitle: {
      marginTop: theme.space(6),
      fontSize: theme.font(14),
      fontWeight: '400',
      color: EMPTY_MUTED,
      lineHeight: theme.font(20),
    },
    activityMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(6),
      marginTop: theme.space(10),
      flexWrap: 'wrap',
    },
    activityMetaPending: {
      fontSize: theme.font(13),
      color: EMPTY_MUTED,
      fontWeight: '500',
    },
    activityMetaCompleted: {
      fontSize: theme.font(13),
      color: STAT_DONE_ACCENT,
      fontWeight: '600',
    },
    editIconBtn: {
      padding: theme.space(6),
      marginLeft: theme.space(4),
      marginTop: theme.space(2),
    },
    emptyCard: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: theme.space(220),
      marginTop: theme.space(4),
      paddingVertical: theme.space(40),
      paddingHorizontal: theme.space(24),
      backgroundColor: EMPTY_CARD_BG,
      borderRadius: theme.space(14),
      borderWidth: 1,
      borderColor: EMPTY_CARD_BORDER,
    },
    emptyCardTitle: {
      marginTop: theme.space(16),
      fontSize: theme.font(17),
      fontWeight: '800',
      color: EMPTY_TITLE,
      textAlign: 'center',
    },
    emptyCardSub: {
      marginTop: theme.space(10),
      fontSize: theme.font(14),
      color: EMPTY_MUTED,
      textAlign: 'center',
      lineHeight: theme.font(21),
      paddingHorizontal: theme.space(8),
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
