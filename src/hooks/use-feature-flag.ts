/**
 * Feature Flag Hook
 * React hook for checking feature flags in components
 */

'use client';

import { useState, useEffect } from 'react';
import { checkFeatureFlagAction } from '@/app/actions/feature-flags/feature-flag-actions';
import { logger } from '@/lib/utils/logger';

interface UseFeatureFlagOptions {
  /**
   * Default value to return while loading or on error
   */
  defaultValue?: boolean;
  /**
   * Whether to refetch when the key or organizationId changes
   */
  refetch?: boolean;
}

interface UseFeatureFlagResult {
  /**
   * Whether the feature flag is enabled
   */
  isEnabled: boolean;
  /**
   * Whether the check is currently loading
   */
  isLoading: boolean;
  /**
   * Error if the check failed
   */
  error: Error | null;
  /**
   * Manually refetch the feature flag status
   */
  refetch: () => Promise<void>;
}

/**
 * Hook to check if a feature flag is enabled
 *
 * @param organizationId - The organization/project ID
 * @param key - The feature flag key
 * @param options - Additional options
 * @returns Feature flag status and loading state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isEnabled, isLoading } = useFeatureFlag(projectId, 'new-dashboard');
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return isEnabled ? <NewDashboard /> : <OldDashboard />;
 * }
 * ```
 */
export function useFeatureFlag(
  organizationId: string | undefined,
  key: string,
  options: UseFeatureFlagOptions = {}
): UseFeatureFlagResult {
  const { defaultValue = false, refetch: autoRefetch = true } = options;

  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkFlag = async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkFeatureFlagAction({
        organizationId,
        key,
      });

      if (result.success && result.data !== undefined) {
        setIsEnabled(result.data);
      } else {
        setIsEnabled(defaultValue);
        logger.warn('Feature flag check failed', { key });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flag'));
      setIsEnabled(defaultValue);
      logger.error('Error checking feature flag', err, { key, organizationId });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoRefetch) {
      checkFlag();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, key, autoRefetch]);

  return {
    isEnabled,
    isLoading,
    error,
    refetch: checkFlag,
  };
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param organizationId - The organization/project ID
 * @param keys - Array of feature flag keys to check
 * @returns Map of feature flag keys to their enabled status
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const flags = useFeatureFlags(projectId, ['feature-a', 'feature-b']);
 *
 *   if (flags.isLoading) return <Spinner />;
 *
 *   return (
 *     <>
 *       {flags.data['feature-a'] && <FeatureA />}
 *       {flags.data['feature-b'] && <FeatureB />}
 *     </>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(
  organizationId: string | undefined,
  keys: string[]
): {
  data: Record<string, boolean>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkFlags = async () => {
    if (!organizationId || keys.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        keys.map(async (key) => {
          const result = await checkFeatureFlagAction({
            organizationId,
            key,
          });
          return {
            key,
            enabled: result.success && result.data ? result.data : false,
          };
        })
      );

      const flagMap = results.reduce(
        (acc, { key, enabled }) => {
          acc[key] = enabled;
          return acc;
        },
        {} as Record<string, boolean>
      );

      setData(flagMap);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flags'));
      logger.error('Error checking feature flags', err, { keys, organizationId });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, JSON.stringify(keys)]);

  return {
    data,
    isLoading,
    error,
    refetch: checkFlags,
  };
}
