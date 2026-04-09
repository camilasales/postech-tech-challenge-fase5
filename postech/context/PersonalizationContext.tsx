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
export type ContrastPreset = 'default' | 'high';
export type SpacingPreset = 'compact' | 'normal' | 'relaxed';

export type PersonalizationSettings = {
  fontSize: FontSizePreset;
  contrast: ContrastPreset;
  spacing: SpacingPreset;
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
  navActiveBg: string;
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

  const colors: ThemeColors =
    settings.contrast === 'high'
      ? {
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
          navActiveBg: '#BFDBFE',
          errorBannerBg: '#FEF9C3',
          errorBannerBorder: '#CA8A04',
          errorBannerText: '#713F12',
          emptySub: '#374151',
          checkboxBorder: '#111827',
          taskCardDoneBorder: '#374151',
          overlayLoading: 'rgba(255,255,255,0.65)',
        }
      : {
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
          navActiveBg: '#EFF6FF',
          errorBannerBg: '#FEF3C7',
          errorBannerBorder: '#FCD34D',
          errorBannerText: '#92400E',
          emptySub: '#9CA3AF',
          checkboxBorder: '#D1D5DB',
          taskCardDoneBorder: '#E5E7EB',
          overlayLoading: 'rgba(249,250,251,0.5)',
        };

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
  resetToDefaults: () => void;
  initializing: boolean;
};

const PersonalizationContext = createContext<PersonalizationContextValue | undefined>(undefined);

function parseStored(raw: string | null): PersonalizationSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const o = JSON.parse(raw) as Partial<PersonalizationSettings>;
    const fontSize =
      o.fontSize === 'small' || o.fontSize === 'medium' || o.fontSize === 'large'
        ? o.fontSize
        : DEFAULT_SETTINGS.fontSize;
    const contrast =
      o.contrast === 'default' || o.contrast === 'high' ? o.contrast : DEFAULT_SETTINGS.contrast;
    const spacing =
      o.spacing === 'compact' || o.spacing === 'normal' || o.spacing === 'relaxed'
        ? o.spacing
        : DEFAULT_SETTINGS.spacing;
    return { fontSize, contrast, spacing };
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

  const setFontSize = useCallback((fontSize: FontSizePreset) => {
    setSettings((s) => {
      const next = { ...s, fontSize };
      void persist(next);
      return next;
    });
  }, [persist]);

  const setContrast = useCallback((contrast: ContrastPreset) => {
    setSettings((s) => {
      const next = { ...s, contrast };
      void persist(next);
      return next;
    });
  }, [persist]);

  const setSpacing = useCallback((spacing: SpacingPreset) => {
    setSettings((s) => {
      const next = { ...s, spacing };
      void persist(next);
      return next;
    });
  }, [persist]);

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
      resetToDefaults,
      initializing,
    }),
    [settings, theme, setFontSize, setContrast, setSpacing, resetToDefaults, initializing]
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
