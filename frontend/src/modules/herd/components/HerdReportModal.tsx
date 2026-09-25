import React, { useMemo } from "react";

import { Animal } from "../../animals/models/Animal";
import { useMilk } from "../../milk/hooks/useMilk";
import { useHealth } from "../../health/hooks/useHealth";
import { useSheds } from "../context/ShedProvider";
import { useCategories } from "../context/CategoryProvider";
import { resolveAnimalShed } from "../utils/shedAssignment";
import {
  BarRow,
  ReportSheet,
  SheetEmpty,
  SheetNote,
  SheetSection,
  StatRow,
  StatTile,
} from "./ReportSheet";

interface HerdReportModalProps {
  visible: boolean;
  onClose: () => void;
  animals: Animal[];
  farmName: string;
}

function startOfDay(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/**
 * A read-only snapshot of the herd, built entirely from data already loaded in
 * context. Nothing here is fetched or persisted — it is a view over the farm's
 * current animals, milk records and health events.
 */
export function HerdReportModal({ visible, onClose, animals, farmName }: HerdReportModalProps) {
  const { milkEntries } = useMilk();
  const { healthEvents } = useHealth();
  const { sheds } = useSheds();
  const { categories } = useCategories();

  const report = useMemo(() => {
    const animalIds = new Set(animals.map((a) => String(a.id)));
    const herdMilk = milkEntries.filter((e) => animalIds.has(String(e.animalId)));

    const todayStart = startOfDay(new Date());
    const weekStart = todayStart - 6 * 86400000;

    const todayLitres = herdMilk
      .filter((e) => startOfDay(e.date) === todayStart)
      .reduce((sum, e) => sum + e.quantity, 0);

    const weekEntries = herdMilk.filter((e) => startOfDay(e.date) >= weekStart);
    const weekLitres = weekEntries.reduce((sum, e) => sum + e.quantity, 0);

    // Days in the last 7 that actually have a record, so the average is not
    // dragged down by days the farmer simply had not logged yet.
    const daysRecorded = new Set(weekEntries.map((e) => startOfDay(e.date))).size;

    const lactating = animals.filter((a) => a.status === "lactating").length;

    const byCategory = categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      count: animals.filter((a) => a.status === c.id).length,
    }));

    const uncategorised = animals.filter(
      (a) => !a.status || !categories.some((c) => c.id === a.status)
    ).length;

    const byShed = sheds.map((shed) => {
      const count = animals.filter((a) => resolveAnimalShed(a, sheds) === shed.id).length;
      const capacity = shed.capacity ?? 0;
      return {
        id: shed.id,
        name: shed.name,
        count,
        capacity,
        occupancy: capacity > 0 ? Math.round((count / capacity) * 100) : null,
      };
    });

    return {
      total: animals.length,
      lactating,
      todayLitres,
      weekLitres,
      dailyAverage: daysRecorded > 0 ? weekLitres / daysRecorded : 0,
      perLactating: lactating > 0 ? todayLitres / lactating : 0,
      daysRecorded,
      health: {
        healthy: animals.filter((a) => a.healthStatus === "healthy").length,
        attention: animals.filter((a) => a.healthStatus === "attention").length,
        critical: animals.filter((a) => a.healthStatus === "critical").length,
      },
      openEvents: healthEvents.filter((e) => animalIds.has(String(e.animalId))).length,
      byCategory,
      uncategorised,
      byShed,
    };
  }, [animals, milkEntries, healthEvents, sheds, categories]);

  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <ReportSheet
      visible={visible}
      onClose={onClose}
      title="Herd Report"
      subtitle={`${farmName} • ${today}`}
    >
      {report.total === 0 ? (
        <SheetEmpty icon="bar-chart-2" text="Add animals to this farm to see a report." />
      ) : (
        <>
          <SheetSection title="Milk Yield" />
          <StatRow>
            <StatTile label="Today" value={`${report.todayLitres.toFixed(1)} L`} color="#0ea5e9" />
            <StatTile
              label="Last 7 days"
              value={`${report.weekLitres.toFixed(1)} L`}
              color="#6366f1"
            />
            <StatTile
              label="Daily average"
              value={`${report.dailyAverage.toFixed(1)} L`}
              color="#16a34a"
            />
          </StatRow>
          <SheetNote>
            {report.daysRecorded === 0
              ? "No milk recorded in the last 7 days."
              : `Average over ${report.daysRecorded} ${
                  report.daysRecorded === 1 ? "day" : "days"
                } with records. Today that is ${report.perLactating.toFixed(
                  1
                )} L per lactating animal.`}
          </SheetNote>

          <SheetSection title="Composition" />
          {report.byCategory.map((c) => (
            <BarRow
              key={c.id}
              label={c.name}
              value={`${c.count}`}
              share={report.total > 0 ? c.count / report.total : 0}
              color={c.color}
            />
          ))}
          {report.uncategorised > 0 && (
            <BarRow
              label="Uncategorised"
              value={`${report.uncategorised}`}
              share={report.uncategorised / report.total}
              color="#94a3b8"
            />
          )}

          <SheetSection title="Shed Occupancy" />
          {report.byShed.length === 0 ? (
            <SheetNote>No sheds defined yet.</SheetNote>
          ) : (
            report.byShed.map((s) => (
              <BarRow
                key={s.id}
                label={s.name}
                value={s.capacity > 0 ? `${s.count}/${s.capacity} (${s.occupancy}%)` : `${s.count}`}
                share={s.capacity > 0 ? Math.min(1, s.count / s.capacity) : 0}
                color="#16a34a"
              />
            ))
          )}

          <SheetSection title="Health" />
          <StatRow>
            <StatTile label="Healthy" value={`${report.health.healthy}`} color="#22c55e" />
            <StatTile label="Attention" value={`${report.health.attention}`} color="#ea580c" />
            <StatTile label="Critical" value={`${report.health.critical}`} color="#ef4444" />
          </StatRow>
          <SheetNote>
            {report.openEvents} health {report.openEvents === 1 ? "event" : "events"} recorded for
            this herd.
          </SheetNote>
        </>
      )}
    </ReportSheet>
  );
}
