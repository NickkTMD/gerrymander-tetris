export interface FeatureFlags {
  periodicBottomClear: boolean;
  sandMode: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  periodicBottomClear: false,
  sandMode: false,
};
