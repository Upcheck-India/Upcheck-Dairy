import React, { useMemo } from "react";

import { Animal } from "../../animals/models/Animal";
import { useHealth } from "../../health/hooks/useHealth";
import { useVaccination } from "../../vaccination/hooks/useVaccination";
import {
  BarRow,
  ReportSheet,
  SheetEmpty,
  SheetListRow,
  SheetNote,
  SheetSection,
  StatRow,
  StatTile,
} from "./ReportSheet";

interface HealthOverviewModalProps {
  visible: boolean;
  onClose: () => void;
  animals: Animal[];
  farmName: string;
  onAnimalPress: (animalId: string) => void;
}

const STATUS_ACCENT: Record<string, string> = {
  healthy: "#22c55e",
  attention: "#ea580c",
  critical: "#ef4444",
};

const EVENT_ACCENT: Record<string, string> = {
  vaccination: "#0ea5e9",
  treatment: "#ef4444",
  diagnosis: "#ea580c",
  observation: "#22c55e",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Health snapshot for the herd: who needs looking at, what vaccinations are
 * due, and what has recently been recorded. Read-only — every figure comes
 * from data already in context.
 */
export function HealthOverviewModal({
  visible,
  onClose,
  animals,
  farmName,
  onAnimalPress,
}: HealthOverviewModalProps) {
  const { healthEvents } = useHealth();
  const { vaccinations } = useVaccination();

  const overview = useMemo(() => {
    const animalIds = new Set(animals.map((a) => String(a.id)));
    const nameFor = (id: string) =>
      animals.find((a) => String(a.id) === String(id))?.name ?? `Animal #${id}`;

    const counts = {
      healthy: animals.filter((a) => a.healthStatus === "healthy").length,
      attention: animals.filter((a) => a.healthStatus === "attention").length,
      critical: animals.filter((a) => a.healthStatus === "critical").length,
    };

    // Critical first, so the most urgent animals are at the top of the list.
    const needsCare = animals
      .filter((a) => a.healthStatus !== "healthy")
      .sort((a, b) => {
        if (a.healthStatus === b.healthStatus) return a.name.localeCompare(b.name);
        return a.healthStatus === "critical" ? -1 : 1;
      });

    const herdVaccinations = vaccinations.filter((v) => animalIds.has(String(v.animalId)));
    const pending = herdVaccinations.filter((v) => v.administeredDate === null);

    const overdue = pending
      .filter((v) => v.isOverdue)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    const upcoming = pending
      .filter((v) => !v.isOverdue && v.daysRemaining <= 30)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    const recentEvents = healthEvents
      .filter((e) => animalIds.has(String(e.animalId)))
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return { counts, needsCare, overdue, upcoming, recentEvents, nameFor, total: animals.length };
  }, [animals, healthEvents, vaccinations]);

  const { counts, total } = overview;
  const healthyShare = total > 0 ? counts.healthy / total : 0;

  return (
    <ReportSheet
      visible={visible}
      onClose={onClose}
      title="Health Overview"
      subtitle={`${farmName} • ${formatDate(new Date())}`}
    >
      {total === 0 ? (
        <SheetEmpty icon="heart" text="Add animals to this farm to track their health." />
      ) : (
        <>
          <SheetSection title="Current Status" />
          <StatRow>
            <StatTile label="Healthy" value={`${counts.healthy}`} color={STATUS_ACCENT.healthy} />
            <StatTile
              label="Attention"
              value={`${counts.attention}`}
              color={STATUS_ACCENT.attention}
            />
            <StatTile label="Critical" value={`${counts.critical}`} color={STATUS_ACCENT.critical} />
          </StatRow>
          <SheetNote>
            {counts.healthy === total
              ? `All ${total} ${total === 1 ? "animal is" : "animals are"} currently healthy.`
              : `${counts.healthy} of ${total} healthy — ${Math.round(
                  healthyShare * 100
                )}% of the herd.`}
          </SheetNote>

          {overview.needsCare.length > 0 && (
            <>
              <SheetSection title={`Needs Attention (${overview.needsCare.length})`} />
              {overview.needsCare.map((animal) => (
                <SheetListRow
                  key={animal.id}
                  icon={animal.healthStatus === "critical" ? "alert-octagon" : "alert-triangle"}
                  accent={STATUS_ACCENT[animal.healthStatus]}
                  title={animal.name}
                  subtitle={
                    animal.tagNumber ? `${animal.breed} • ${animal.tagNumber}` : animal.breed
                  }
                  trailing={animal.healthStatus === "critical" ? "Critical" : "Attention"}
                  onPress={() => {
                    onClose();
                    onAnimalPress(String(animal.id));
                  }}
                />
              ))}
            </>
          )}

          <SheetSection title="Vaccinations" />
          {overview.overdue.length === 0 && overview.upcoming.length === 0 ? (
            <SheetNote>
              {vaccinations.length === 0
                ? "No vaccinations scheduled yet."
                : "Nothing overdue and nothing due in the next 30 days."}
            </SheetNote>
          ) : (
            <>
              {overview.overdue.map((v) => (
                <SheetListRow
                  key={v.id}
                  icon="alert-circle"
                  accent="#ef4444"
                  title={`${overview.nameFor(v.animalId)} — ${v.vaccineName}`}
                  subtitle={`Was due ${formatDate(v.scheduledDate)}`}
                  trailing={`${Math.abs(v.daysRemaining)}d late`}
                />
              ))}
              {overview.upcoming.map((v) => (
                <SheetListRow
                  key={v.id}
                  icon="calendar"
                  accent="#0ea5e9"
                  title={`${overview.nameFor(v.animalId)} — ${v.vaccineName}`}
                  subtitle={`Due ${formatDate(v.scheduledDate)}`}
                  trailing={v.daysRemaining === 0 ? "Today" : `in ${v.daysRemaining}d`}
                />
              ))}
            </>
          )}

          <SheetSection title="Recent Records" />
          {overview.recentEvents.length === 0 ? (
            <SheetNote>No health events recorded for this herd yet.</SheetNote>
          ) : (
            overview.recentEvents.map((e) => (
              <SheetListRow
                key={e.id}
                icon="file-text"
                accent={EVENT_ACCENT[e.type] ?? "#64748b"}
                title={overview.nameFor(String(e.animalId))}
                subtitle={`${e.description} • ${formatDate(new Date(e.date))}`}
                onPress={() => {
                  onClose();
                  onAnimalPress(String(e.animalId));
                }}
              />
            ))
          )}

          <SheetSection title="Herd Health Split" />
          <BarRow
            label="Healthy"
            value={`${counts.healthy}`}
            share={healthyShare}
            color={STATUS_ACCENT.healthy}
          />
          <BarRow
            label="Attention"
            value={`${counts.attention}`}
            share={total > 0 ? counts.attention / total : 0}
            color={STATUS_ACCENT.attention}
          />
          <BarRow
            label="Critical"
            value={`${counts.critical}`}
            share={total > 0 ? counts.critical / total : 0}
            color={STATUS_ACCENT.critical}
          />
        </>
      )}
    </ReportSheet>
  );
}
