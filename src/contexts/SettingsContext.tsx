// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS CONTEXT — loads live restaurant settings from the API once and shares
// them across the public site (footer, contact, etc.). Falls back to sensible
// defaults so the UI always renders, even if the API is briefly unavailable.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { settingsApi } from '../lib/api';
import { DEFAULT_RESTAURANT_SETTINGS } from '../lib/restaurantSettings';
import type { RestaurantSettings } from '../types';

interface SettingsContextValue {
  settings: RestaurantSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_RESTAURANT_SETTINGS,
  loading: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_RESTAURANT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await settingsApi.get();
        if (!active) return;
        if (res.data) {
          // Merge over defaults so any missing field stays populated.
          setSettings({ ...DEFAULT_RESTAURANT_SETTINGS, ...res.data });
        }
      } catch {
        // Keep defaults on failure.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
