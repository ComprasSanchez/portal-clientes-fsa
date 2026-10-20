export const EXTERNAL_HANDOFF_SYSTEMS = ["BREVE", "FARMA"] as const;

export type ExternalHandoffSystem = (typeof EXTERNAL_HANDOFF_SYSTEMS)[number];
