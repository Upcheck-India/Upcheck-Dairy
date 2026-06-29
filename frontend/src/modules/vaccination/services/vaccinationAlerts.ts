import { Vaccination } from "../models/Vaccination";

export function computeUpcomingVaccinationsCount(vaccinations: Vaccination[]): number {
  return vaccinations.filter((v: Vaccination) => {
    if (v.administeredDate !== null) return false;
    const days = Math.floor(
      (v.scheduledDate.getTime() - Date.now()) / 86400000
    );
    return days <= 7;
  }).length;
}
