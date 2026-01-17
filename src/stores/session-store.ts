import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Tenant, Store, StoreBrief, TenantSettings, DeviceInfo } from '@/types';

interface SessionState {
  // Device session (kiosk authentication)
  deviceSessionId: string | null;
  deviceInfo: DeviceInfo | null;
  isDeviceAuthenticated: boolean;

  // Tenant (populated from device auth response)
  tenantSlug: string | null;
  tenant: Tenant | null;

  // Store (can be set from device auth or manually selected)
  selectedStoreId: string | null;
  selectedStore: StoreBrief | Store | null;

  // Auth tokens
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;  // Unix timestamp (ms) when access token expires

  // Status
  isInitialized: boolean;

  // Device Actions
  setDeviceSession: (deviceInfo: DeviceInfo, accessToken: string, refreshToken: string, expiresIn: number) => void;
  updateTokens: (accessToken: string, refreshToken: string, expiresIn?: number) => void;
  clearDeviceSession: () => void;

  // Tenant/Store Actions
  setTenant: (slug: string, tenant: Tenant) => void;
  setStore: (store: StoreBrief | Store) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;

  // Token accessors for API client
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;

  // Token expiration check
  isTokenExpiringSoon: (thresholdMs?: number) => boolean;
}

const initialState = {
  deviceSessionId: null,
  deviceInfo: null,
  isDeviceAuthenticated: false,
  tenantSlug: null,
  tenant: null,
  selectedStoreId: null,
  selectedStore: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  isInitialized: false,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDeviceSession: (deviceInfo, accessToken, refreshToken, expiresIn) => set({
        deviceSessionId: deviceInfo.sessionId,
        deviceInfo,
        isDeviceAuthenticated: true,
        accessToken,
        refreshToken,
        tokenExpiresAt: Date.now() + expiresIn,
        // Set store if device is bound to a specific store
        selectedStoreId: deviceInfo.storeId || null,
        // Create minimal store object from device info if bound
        selectedStore: deviceInfo.storeId && deviceInfo.storeName ? {
          id: deviceInfo.storeId,
          name: deviceInfo.storeName,
          slug: deviceInfo.storeSlug || '',
        } : null,
        // Mark as initialized since we just logged in
        isInitialized: true,
      }),

      updateTokens: (accessToken, refreshToken, expiresIn) => {
        // Calculate expiration time - default to 1 hour if not provided
        const tokenExpiresAt = expiresIn ? Date.now() + expiresIn : Date.now() + 3600000;

        // Update state
        set({ accessToken, refreshToken, tokenExpiresAt });
        // Force immediate localStorage persistence to prevent token loss on page refresh
        // This is a backup in case Zustand's async persist hasn't completed
        try {
          const stored = localStorage.getItem('tabletop-session');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.state.accessToken = accessToken;
            parsed.state.refreshToken = refreshToken;
            parsed.state.tokenExpiresAt = tokenExpiresAt;
            localStorage.setItem('tabletop-session', JSON.stringify(parsed));
          }
        } catch (e) {
          console.warn('[SessionStore] Failed to immediately persist tokens:', e);
        }
      },

      clearDeviceSession: () => set({
        deviceSessionId: null,
        deviceInfo: null,
        isDeviceAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
      }),

      setTenant: (slug, tenant) => set({
        tenantSlug: slug,
        tenant,
      }),

      setStore: (store) => set({
        selectedStoreId: store.id,
        selectedStore: store,
      }),

      setInitialized: (initialized) => set({
        isInitialized: initialized,
      }),

      reset: () => set(initialState),

      // Token accessors
      getAccessToken: () => get().accessToken,
      getRefreshToken: () => get().refreshToken,

      // Check if token is expiring soon (default: 5 minutes)
      isTokenExpiringSoon: (thresholdMs = 5 * 60 * 1000) => {
        const { tokenExpiresAt, accessToken } = get();
        if (!accessToken || !tokenExpiresAt) return false;
        return Date.now() >= tokenExpiresAt - thresholdMs;
      },
    }),
    {
      name: 'tabletop-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist device session data
        deviceSessionId: state.deviceSessionId,
        deviceInfo: state.deviceInfo,
        isDeviceAuthenticated: state.isDeviceAuthenticated,
        tenantSlug: state.tenantSlug,
        tenant: state.tenant, // Persist tenant to avoid re-fetching on every page load
        selectedStoreId: state.selectedStoreId,
        selectedStore: state.selectedStore,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    }
  )
);

// Helper to get tenant settings with type safety
export function getTenantSettings(tenant: Tenant | null): TenantSettings {
  return tenant?.settings || {};
}

// Helper to check if device is authenticated
export function useIsDeviceAuthenticated(): boolean {
  return useSessionStore((state) => state.isDeviceAuthenticated);
}
