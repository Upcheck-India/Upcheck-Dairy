export type HealthStatusValue = "healthy" | "attention" | "critical";

/** Severity ordering, so statuses can be compared rather than just matched. */
const SEVERITY: Record<HealthStatusValue, number> = {
  healthy: 0,
  attention: 1,
  critical: 2,
};

/**
 * The status an animal should hold after a note implying `implied` is recorded.
 *
 * Only ever escalates. Logging "fever" on an animal already marked critical
 * must not quietly downgrade it, and recovery is something the farmer states
 * explicitly rather than something a symptom note can infer.
 *
 * Returns null when nothing needs to change, so callers can skip the write.
 */
export function escalatedHealthStatus(
  current: HealthStatusValue,
  implied: HealthStatusValue | null
): HealthStatusValue | null {
  if (!implied) return null;
  return SEVERITY[implied] > SEVERITY[current] ? implied : null;
}

export function isHealthStatusWorseThan(
  status: HealthStatusValue,
  than: HealthStatusValue
): boolean {
  return SEVERITY[status] > SEVERITY[than];
}
