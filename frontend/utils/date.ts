/**
 * Convert any date to a YYYY-MM-DD string in IST (Indian Standard Time, UTC+05:30) timezone.
 */
export function getISTDateString(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) {
    return "";
  }
  // Shift UTC by 5.5 hours to represent IST
  const shifted = new Date(date.getTime() + (330 * 60 * 1000));
  return shifted.toISOString().split("T")[0];
}

export function getTodayString(): string {
  return getISTDateString();
}
