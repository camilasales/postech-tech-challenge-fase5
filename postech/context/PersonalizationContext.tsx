import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@postech/personalization';

export type FontSizePreset = 'small' | 'medium' | 'large';
export type ContrastPreset = 'default' | 'high' | 'max';
export type SpacingPreset = 'compact' | 'normal' | 'relaxed';
export type InterfaceModePreset = 'basic' | 'advanced';

export type PersonalizationSettings = {
  fontSize: FontSizePreset;
  contrast: ContrastPreset;
  spacing: SpacingPreset;
  interfaceMode: InterfaceModePreset;
  enhancedFeedback: boolean;
  extraConfirmations: boolean;
  reminderNotifications: boolean;
};

export type ThemeColors = {
  bgPage: string;
  card: string;
  cardDone: string;
  text: string;
  muted: string;
  border: string;
  blue: string;
  tomorrow: string;
  placeholder: string;
  chipActiveBg: string;
  navAccent: string;
  navActiveBg: string;
  navInactive: string;
  errorBannerBg: string;
  errorBannerBorder: string;
  errorBannerText: string;
  emptySub: string;
  checkboxBorder: string;
  taskCardDoneBorder: string;
  overlayLoading: string;
};

export type AppTheme = {
  colors: ThemeColors;
  font: (base: number) => number;
  space: (base: number) => number;
  icon: (base: number) => number;
  fontScale: number;
  spacingScale: number;
};

const DEFAULT_SETTINGS: PersonalizationSettings = {
  fontSize: 'medium',
  contrast: 'default',
  spacing: 'normal',
  interfaceMode: 'basic',
  enhancedFeedback: true,
  extraConfirmations: true,
  reminderNotifications: true,
};

const FONT_MULT: Record<FontSizePreset, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
};

const SPACE_MULT: Record<SpacingPreset, number> = {
  compact: 0.85,
  normal: 1,
  relaxed: 1.2,
};

function buildTheme(settings: PersonalizationSettings): AppTheme {
  const fontScale = FONT_MULT[settings.fontSize];
  const spacingScale = SPACE_MULT[settings.spacing];

  const font = (base: number) => Math.max(10, Math.round(base * fontScale));
  const space = (base: number) => Math.max(0, Math.round(base * spacingScale));
  const icon = (base: number) => Math.max(12, Math.round(base * fontScale));

  const highContrastColors: ThemeColors = {
    bgPage: '#FFFFFF',
    card: '#F3F4F6',
    cardDone: '#E5E7EB',
    text: '#000000',
    muted: '#1F2937',
    border: '#111827',
    blue: '#1D4ED8',
    tomorrow: '#C2410C',
    placeholder: '#374151',
    chipActiveBg: '#DBEAFE',
    navAccent: '#2563EB',
    navActiveBg: '#DBEAFE',
    navInactive: '#1F2937',
    errorBannerBg: '#FEF9C3',
    errorBannerBorder: '#CA8A04',
    errorBannerText: '#713F12',
    emptySub: '#374151',
    checkboxBorder: '#111827',
    taskCardDoneBorder: '#374151',
    overlayLoading: 'rgba(255,255,255,0.65)',
  };

  const maxContrastColors: ThemeColors = {
    ...highContrastColors,
    bgPage: '#FFFFFF',
    card: '#FFFFFF',
    cardDone: '#E5E7EB',
    border: '#000000',
    checkboxBorder: '#000000',
    taskCardDoneBorder: '#000000',
    blue: '#1E3A8A',
    muted: '#000000',
  };

  const defaultColors: ThemeColors = {
    bgPage: '#F9FAFB',
    card: '#FFFFFF',
    cardDone: '#F3F4F6',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    blue: '#2563EB',
    tomorrow: '#EA580C',
    placeholder: '#9CA3AF',
    chipActiveBg: '#EFF6FF',
    navAccent: '#2563EB',
    navActiveBg: '#EFF6FF',
    navInactive: '#4B5563',
    errorBannerBg: '#FEF3C7',
    errorBannerBorder: '#FCD34D',
    errorBannerText: '#92400E',
    emptySub: '#9CA3AF',
    checkboxBorder: '#D1D5DB',
    taskCardDoneBorder: '#E5E7EB',
    overlayLoading: 'rgba(249,250,251,0.5)',
  };

  const colors: ThemeColors =
    settings.contrast === 'max'
      ? maxContrastColors
      : settings.contrast === 'high'
        ? highContrastColors
        : defaultColors;

  return {
    colors,
    font,
    space,
    icon,
    fontScale,
    spacingScale,
  };
}

type PersonalizationContextValue = {
  settings: PersonalizationSettings;
  theme: AppTheme;
  setFontSize: (v: FontSizePreset) => void;
  setContrast: (v: ContrastPreset) => void;
  setSpacing: (v: SpacingPreset) => void;
  setInterfaceMode: (v: InterfaceModePreset) => void;
  setEnhancedFeedback: (v: boolean) => void;
  setExtraConfirmations: (v: boolean) => void;
  setReminderNotifications: (v: boolean) => void;
  resetToDefaults: () => void;
  initializing: boolean;
};

const PersonalizationContext = createContext<PersonalizationContextValue | undefined>(undefined);

function parseStored(raw: string | null): PersonalizationSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const value = JSON.parse(raw) as Partial<PersonalizationSettings>;
    return {
      fontSize:
        value.fontSize === 'small' || value.fontSize === 'medium' || value.fontSize === 'large'
          ? value.fontSize
          : DEFAULT_SETTINGS.fontSize,
      contrast:
        value.contrast === 'default' || value.contrast === 'high' || value.contrast === 'max'
          ? value.contrast
          : DEFAULT_SETTINGS.contrast,
      spacing:
        value.spacing === 'compact' || value.spacing === 'normal' || value.spacing === 'relaxed'
          ? value.spacing
          : DEFAULT_SETTINGS.spacing,
      interfaceMode:
        value.interfaceMode === 'basic' || value.interfaceMode === 'advanced'
          ? value.interfaceMode
          : DEFAULT_SETTINGS.interfaceMode,
      enhancedFeedback:
        typeof value.enhancedFeedback === 'boolean'
          ? value.enhancedFeedback
          : DEFAULT_SETTINGS.enhancedFeedback,
      extraConfirmations:
        typeof value.extraConfirmations === 'boolean'
          ? value.extraConfirmations
          : DEFAULT_SETTINGS.extraConfirmations,
      reminderNotifications:
        typeof value.reminderNotifications === 'boolean'
          ? value.reminderNotifications
          : DEFAULT_SETTINGS.reminderNotifications,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PersonalizationSettings>(DEFAULT_SETTINGS);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled) setSettings(parseStored(raw));
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: PersonalizationSettings) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateSettings = useCallback(
    (updater: (current: PersonalizationSettings) => PersonalizationSettings) => {
      setSettings((current) => {
        const next = updater(current);
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  const setFontSize = useCallback((fontSize: FontSizePreset) => {
    updateSettings((current) => ({ ...current, fontSize }));
  }, [updateSettings]);

  const setContrast = useCallback((contrast: ContrastPreset) => {
    updateSettings((current) => ({ ...current, contrast }));
  }, [updateSettings]);

  const setSpacing = useCallback((spacing: SpacingPreset) => {
    updateSettings((current) => ({ ...current, spacing }));
  }, [updateSettings]);

  const setInterfaceMode = useCallback((interfaceMode: InterfaceModePreset) => {
    updateSettings((current) => ({ ...current, interfaceMode }));
  }, [updateSettings]);

  const setEnhancedFeedback = useCallback((enhancedFeedback: boolean) => {
    updateSettings((current) => ({ ...current, enhancedFeedback }));
  }, [updateSettings]);

  const setExtraConfirmations = useCallback((extraConfirmations: boolean) => {
    updateSettings((current) => ({ ...current, extraConfirmations }));
  }, [updateSettings]);

  const setReminderNotifications = useCallback((reminderNotifications: boolean) => {
    updateSettings((current) => ({ ...current, reminderNotifications }));
  }, [updateSettings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    void persist(DEFAULT_SETTINGS);
  }, [persist]);

  const theme = useMemo(() => buildTheme(settings), [settings]);

  const value = useMemo<PersonalizationContextValue>(
    () => ({
      settings,
      theme,
      setFontSize,
      setContrast,
      setSpacing,
      setInterfaceMode,
      setEnhancedFeedback,
      setExtraConfirmations,
      setReminderNotifications,
      resetToDefaults,
      initializing,
    }),
    [
      settings,
      theme,
      setFontSize,
      setContrast,
      setSpacing,
      setInterfaceMode,
      setEnhancedFeedback,
      setExtraConfirmations,
      setReminderNotifications,
      resetToDefaults,
      initializing,
    ]
  );

  return (
    <PersonalizationContext.Provider value={value}>{children}</PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) {
    throw new Error('usePersonalization must be used within PersonalizationProvider');
  }
  return ctx;
}
