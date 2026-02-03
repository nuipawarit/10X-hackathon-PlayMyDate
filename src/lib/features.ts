export const FEATURES = {
  PLAYCOIN: process.env.NEXT_PUBLIC_FEATURE_PLAYCOIN === 'true',
  PARADISE_MODE: process.env.NEXT_PUBLIC_FEATURE_PARADISE_MODE === 'true',
  B2B: process.env.NEXT_PUBLIC_FEATURE_B2B === 'true',
  DEBUG_MODE: process.env.NODE_ENV === 'development',
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
