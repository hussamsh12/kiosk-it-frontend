'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { api, setTokenStore, getCurrentTenant, refreshDeviceToken } from '@/lib/api';

// Proactive refresh threshold: 5 minutes before expiration
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
// Check interval: every 1 minute
const REFRESH_CHECK_INTERVAL_MS = 60 * 1000;

interface SessionProviderProps {
  children: React.ReactNode;
  tenantSlug?: string; // From middleware/server component
}

export function SessionProvider({ children, tenantSlug }: SessionProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const hasInitialized = useRef(false);

  const {
    tenantSlug: storedTenantSlug,
    tenant: storedTenant,
    deviceInfo,
    isDeviceAuthenticated,
    setTenant,
    setInitialized,
    updateTokens,
    clearDeviceSession,
  } = useSessionStore();

  // Handle client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Setup token store for API client
  useEffect(() => {
    if (!isHydrated) return;

    setTokenStore({
      getAccessToken: () => useSessionStore.getState().accessToken,
      getRefreshToken: () => useSessionStore.getState().refreshToken,
      setTokens: updateTokens,
      clearTokens: clearDeviceSession,
      isDeviceSession: () => useSessionStore.getState().isDeviceAuthenticated,
      isTokenExpiringSoon: (thresholdMs) => useSessionStore.getState().isTokenExpiringSoon(thresholdMs),
    });
  }, [isHydrated, updateTokens, clearDeviceSession]);

  // Proactive token refresh - check every minute and refresh if expiring soon
  const proactiveRefresh = useCallback(async () => {
    const state = useSessionStore.getState();

    // Only refresh if we have a device session
    if (!state.isDeviceAuthenticated || !state.refreshToken) {
      return;
    }

    // Check if token is expiring soon (within threshold)
    if (!state.isTokenExpiringSoon(REFRESH_THRESHOLD_MS)) {
      return;
    }

    console.log('[SessionProvider] Token expiring soon, proactively refreshing...');

    try {
      const response = await refreshDeviceToken(state.refreshToken);
      updateTokens(response.accessToken, response.refreshToken, response.expiresIn);
      console.log('[SessionProvider] Proactive token refresh successful');
    } catch (error) {
      console.warn('[SessionProvider] Proactive token refresh failed:', error);
      // Don't clear session on proactive refresh failure - the reactive refresh will handle it
    }
  }, [updateTokens]);

  // Setup proactive refresh interval
  useEffect(() => {
    if (!isHydrated) return;

    // Run immediately on mount (in case we're already close to expiration)
    proactiveRefresh();

    // Set up interval for periodic checks
    const intervalId = setInterval(proactiveRefresh, REFRESH_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isHydrated, proactiveRefresh]);

  // Initialize session (only once after hydration)
  useEffect(() => {
    if (!isHydrated || hasInitialized.current) return;
    hasInitialized.current = true;

    const initSession = async () => {
      // Read directly from store state to get latest hydrated values
      const state = useSessionStore.getState();
      const {
        isDeviceAuthenticated: isAuth,
        deviceInfo: device,
        accessToken,
        tenant: persistedTenant
      } = state;

      console.log('[SessionProvider] initSession', {
        isAuth,
        hasDevice: !!device,
        hasToken: !!accessToken,
        hasPersistedTenant: !!persistedTenant,
      });

      try {
        // If device is already authenticated, set tenant from device info
        if (isAuth && device && accessToken) {
          console.log('[SessionProvider] Device authenticated');
          api.setTenantId(device.tenantId);

          // Use persisted tenant if available (avoids unnecessary API call)
          if (persistedTenant) {
            console.log('[SessionProvider] Using persisted tenant');
            setInitialized(true);
            return;
          }

          // Fetch full tenant info via protected endpoint
          try {
            console.log('[SessionProvider] Fetching tenant from API');
            const tenant = await getCurrentTenant();
            const slugToUse = tenantSlug || storedTenantSlug || tenant.slug;
            setTenant(slugToUse, tenant);
            console.log('[SessionProvider] Tenant fetched successfully');
          } catch (error) {
            console.warn('[SessionProvider] Failed to fetch tenant:', error);
            // Only clear session if we have no persisted tenant AND get auth error
            // The API client already tried token refresh, so if we still get 401/403,
            // the refresh token is truly invalid
            if (error && typeof error === 'object' && 'status' in error) {
              const status = (error as { status: number }).status;
              if (status === 401 || status === 403) {
                console.log('[SessionProvider] Auth invalid after token refresh failed, clearing session');
                clearDeviceSession();
              }
            }
            // For other errors (network, 500, etc.), don't clear session - it might be transient
          }

          setInitialized(true);
          return;
        }

        // Not authenticated - will redirect to setup
        console.log('[SessionProvider] Not authenticated');
        setInitialized(true);
      } catch (error) {
        console.error('[SessionProvider] Init error:', error);
        setInitialized(true);
      }
    };

    initSession();
  }, [isHydrated, tenantSlug, storedTenantSlug, storedTenant, setTenant, setInitialized, clearDeviceSession]);

  // Show nothing until hydrated to prevent mismatch
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
