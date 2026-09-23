import React, { useState } from "react";
import TabsContainer from "../../TabsContainer";
import WeekPicker, { type DateSpan } from "./Helpers/WeekPicker";
import { Button } from "react-bootstrap";
import { getFromWorker } from "../../../classes/CloudflareWorker/WorkerUtils";
import { UsageStatsTable, type DailyUsageStats } from "./Helpers/UsageStatsTable/UsageStatsTable";


interface StatsViewProps {}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export const StatsView: React.FC<StatsViewProps> = () => {
  const [dateSpan, setDateSpan] = useState<DateSpan>();
  const [stats, setStats] = useState<DailyUsageStats[]>([]);
  const [loading, setLoading] = useState(false);

  const dates =
    dateSpan?.startDate && dateSpan?.endDate
      ? getDatesBetween(dateSpan.startDate, dateSpan.endDate)
      : [];

  return (
    <>
      <Button
        onClick={async () => {
          if (!dateSpan?.startDate || !dateSpan?.endDate) {
            console.log("Date Not Picked");
            return;
          }

          try {
            setLoading(true);

            const response = await getFromWorker("stats", {
              start_date: formatDate(dateSpan.startDate),
              end_date: formatDate(dateSpan.endDate),
            });
            setStats(response.data);
            console.log(response.data);
          } catch (error) {
            console.error("Failed to get stats:", error);
            setStats([]);
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Loading..." : "Get Stats"}
      </Button>

      <WeekPicker value={dateSpan} onChange={setDateSpan} />
      <br />

      <TabsContainer
        tabs={{
          Weekly_Stats: (
            <>
              <UsageStatsTable stats={stats} dates={dates} />
            </>
          ),
          Provider_Usage: <></>,
        }}
      />
    </>
  );
};