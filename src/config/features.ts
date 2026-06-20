// Feature flags — flip while prototyping. A screen guarded by an OFF flag
// shows a friendly "coming soon" stub instead of being built/hidden.
// Phase numbers map to ../../consolidated-features.md.
export const FEATURES = {
  // Phase 1 — Essential (built)
  adminDashboard: true,
  companies: true,
  investorsKyc: true,
  distributions: true,
  bapmPnl: true,
  bagiHasil: true,
  bapmReports: true,
  investorPortal: true,

  // Phase 2/3 — deferred (stubs / future)
  aiExtraction: false,
  realPdfExport: false,
  benchmarking: false,
  meetingMode: false,
  announcements: false,
} as const

export type FeatureKey = keyof typeof FEATURES
export const isOn = (k: FeatureKey) => FEATURES[k]
