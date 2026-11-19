import React, { useEffect, useState } from "react";
import { Button, Spinner, Stack, Table } from "react-bootstrap";
import { UsageCellPreview, type UsageSummary } from "./UsageCellPreview";
import WeekPicker, { getCurrentWeekSpan, type DateSpan } from "../WeekPicker";
import { getFromWorker } from "../../../../../classes/CloudflareWorker/WorkerUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faRefresh } from "@fortawesome/free-solid-svg-icons";

export type DailyUsageStats = {
  user_email: string;
  project: string | null;
  provider: string;
  model: string | null;
  date: string;
  number_of_requests: number;
  total_cost: number;
  average_cost: number;
  average_req_duration: number;
  average_generation_duration: number;
};

export type UserStats = {
  email: string;
  daily: Record<string, UsageSummary>;
  total: UsageSummary;
};

interface UsageStatsTableProps {

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

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}


export const UsageStatsTable: React.FC<UsageStatsTableProps> = ({ }) => {
  const [dateSpan, setDateSpan] = useState<DateSpan>(getCurrentWeekSpan);
  const [stats, setStats] = useState<DailyUsageStats[]>([]);
  const [loading, setLoading] = useState(false);

  const dates =
    dateSpan?.startDate && dateSpan?.endDate
      ? getDatesBetween(dateSpan.startDate, dateSpan.endDate)
      : [];

  const userStats = buildUserStats(stats, dates);
  const { dailyTotals, overallTotal } = calculateGrandTotals(userStats, dates);

  const refresh_datespan = async () => {
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

  }

  useEffect(() => { refresh_datespan(); }, [dateSpan])

  return (
    <>
      <Stack direction="horizontal" gap={0}>
        <WeekPicker value={dateSpan} onChange={setDateSpan} />

        <Button
          size="sm"
          variant="outline-primary"
          onClick={refresh_datespan}
          disabled={loading}
        >
          {loading ? (
            <Spinner
              animation="border"
              size="sm"
              role="status"
            />
          ) : (
            <FontAwesomeIcon icon={faRefresh} />
          )}
        </Button>

        <Button
          size="sm"
          variant="outline-warning"
          onClick={async () => {
            try {
              const markdown = await copyUsageStatsToSheets(stats);
              console.log("Copied Markdown:", markdown);
            } catch (error) {
              console.error("Failed to copy:", error);
            }
          }}
        >
          <FontAwesomeIcon icon={faCopy} />
        </Button>

      </Stack>
      <br />

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          position: "relative",
        }}
      >
        <Table
          striped
          bordered
          hover
          className="align-top"
          style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            minWidth: "max-content",
            borderTop: "1px solid #545454",
            borderBottom: "1px solid #545454",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  position: "sticky",
                  left: 0,
                  minWidth: 200,
                  zIndex: 4,
                }}
              >
                Username
              </th>

              {dates.map((date) => (
                <th key={formatDateKey(date)} className="text-center">
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "numeric",
                    day: "numeric",
                  })}
                </th>
              ))}

              <th
                className="text-center"
                style={{
                  position: "sticky",
                  right: 0,
                  minWidth: 200,
                  zIndex: 4,
                }}
              >
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {userStats.map((user) => (
              <tr key={user.email}>
                <td
                  className="fw-bold align-middle"
                  style={{
                    position: "sticky",
                    left: 0,
                    minWidth: 200,
                    zIndex: 2,
                  }}
                >
                  {user.email}
                </td>

                {dates.map((date) => {
                  const dateKey = formatDateKey(date);
                  const daySummary = user.daily[dateKey];

                  return (
                    <td key={dateKey} className="p-0">
                      <UsageCellPreview summary={daySummary} />
                    </td>
                  );
                })}

                <td
                  className="p-0"
                  style={{
                    position: "sticky",
                    right: 0,
                    minWidth: 200,
                    zIndex: 2,
                  }}
                >
                  <UsageCellPreview summary={user.total} />
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="fw-bold">
              <td
                className="align-middle"
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                }}
              >
                Total
              </td>

              {dates.map((date) => {
                const dateKey = formatDateKey(date);

                return (
                  <td key={dateKey} className="p-0">
                    <UsageCellPreview summary={dailyTotals[dateKey]} />
                  </td>
                );
              })}

              <td
                className="p-0 table-dark"
                style={{
                  position: "sticky",
                  right: 0,
                  zIndex: 3,
                }}
              >
                <UsageCellPreview summary={overallTotal} />
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>
    </>
  );
};

// --- Helper Functions ---

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildUserStats(
  stats: DailyUsageStats[],
  dates: Date[]
): UserStats[] {
  const users: Record<string, Record<string, UsageSummary>> = {};

  for (const row of stats) {
    if (!users[row.user_email]) {
      users[row.user_email] = {};
    }

    if (!users[row.user_email][row.date]) {
      users[row.user_email][row.date] = {
        totalRequests: 0,
        totalCost: 0,
        totalDuration: 0,
        providers: {},
        userEmail: row.user_email,
        date: row.date,
      };
    }

    const dayData = users[row.user_email][row.date];
    const requests = row.number_of_requests || 0;
    const cost = row.total_cost || 0;
    const duration = (row.average_req_duration || 0) * requests;
    const modelName = row.model || "Unknown";

    dayData.totalRequests += requests;
    dayData.totalCost += cost;
    dayData.totalDuration += duration;

    if (!dayData.providers[row.provider]) {
      dayData.providers[row.provider] = { requests: 0, cost: 0, totalDuration: 0, models: {} };
    }

    dayData.providers[row.provider].requests += requests;
    dayData.providers[row.provider].cost += cost;
    dayData.providers[row.provider].totalDuration += duration;

    if (!dayData.providers[row.provider].models[modelName]) {
      dayData.providers[row.provider].models[modelName] = { requests: 0, cost: 0, totalDuration: 0 };
    }

    dayData.providers[row.provider].models[modelName].requests += requests;
    dayData.providers[row.provider].models[modelName].cost += cost;
    dayData.providers[row.provider].models[modelName].totalDuration += duration;
  }

  return Object.entries(users).map(([email, daily]) => {
    const totalSummary: UsageSummary = {
      totalRequests: 0,
      totalCost: 0,
      totalDuration: 0,
      providers: {},
      userEmail: email,
    };

    for (const date of dates) {
      const dateKey = formatDateKey(date);
      const dayData = daily[dateKey];

      if (dayData) {
        totalSummary.totalRequests += dayData.totalRequests;
        totalSummary.totalCost += dayData.totalCost;
        totalSummary.totalDuration += dayData.totalDuration;

        for (const [provider, providerStat] of Object.entries(dayData.providers)) {
          if (!totalSummary.providers[provider]) {
            totalSummary.providers[provider] = { requests: 0, cost: 0, totalDuration: 0, models: {} };
          }
          totalSummary.providers[provider].requests += providerStat.requests;
          totalSummary.providers[provider].cost += providerStat.cost;
          totalSummary.providers[provider].totalDuration += providerStat.totalDuration;

          for (const [model, modelStat] of Object.entries(providerStat.models)) {
            if (!totalSummary.providers[provider].models[model]) {
              totalSummary.providers[provider].models[model] = { requests: 0, cost: 0, totalDuration: 0 };
            }
            totalSummary.providers[provider].models[model].requests += modelStat.requests;
            totalSummary.providers[provider].models[model].cost += modelStat.cost;
            totalSummary.providers[provider].models[model].totalDuration += modelStat.totalDuration;
          }
        }
      }
    }

    return {
      email,
      daily,
      total: totalSummary,
    };
  });
}

export function calculateGrandTotals(
  userStats: UserStats[],
  dates: Date[]
): {
  dailyTotals: Record<string, UsageSummary>;
  overallTotal: UsageSummary;
} {
  const dailyTotals: Record<string, UsageSummary> = {};
  const overallTotal: UsageSummary = {
    totalRequests: 0,
    totalCost: 0,
    totalDuration: 0,
    providers: {},
  };

  for (const date of dates) {
    const dateKey = formatDateKey(date);
    dailyTotals[dateKey] = {
      totalRequests: 0,
      totalCost: 0,
      totalDuration: 0,
      providers: {},
      date: dateKey,
    };
  }

  for (const user of userStats) {
    overallTotal.totalRequests += user.total.totalRequests;
    overallTotal.totalCost += user.total.totalCost;
    overallTotal.totalDuration += user.total.totalDuration;

    for (const [provider, stat] of Object.entries(user.total.providers)) {
      if (!overallTotal.providers[provider]) {
        overallTotal.providers[provider] = { requests: 0, cost: 0, totalDuration: 0, models: {} };
      }
      overallTotal.providers[provider].requests += stat.requests;
      overallTotal.providers[provider].cost += stat.cost;
      overallTotal.providers[provider].totalDuration += stat.totalDuration;

      for (const [model, modelStat] of Object.entries(stat.models)) {
        if (!overallTotal.providers[provider].models[model]) {
          overallTotal.providers[provider].models[model] = { requests: 0, cost: 0, totalDuration: 0 };
        }
        overallTotal.providers[provider].models[model].requests += modelStat.requests;
        overallTotal.providers[provider].models[model].cost += modelStat.cost;
        overallTotal.providers[provider].models[model].totalDuration += modelStat.totalDuration;
      }
    }

    for (const date of dates) {
      const dateKey = formatDateKey(date);
      const dayData = user.daily[dateKey];

      if (dayData) {
        dailyTotals[dateKey].totalRequests += dayData.totalRequests;
        dailyTotals[dateKey].totalCost += dayData.totalCost;
        dailyTotals[dateKey].totalDuration += dayData.totalDuration;

        for (const [provider, stat] of Object.entries(dayData.providers)) {
          if (!dailyTotals[dateKey].providers[provider]) {
            dailyTotals[dateKey].providers[provider] = { requests: 0, cost: 0, totalDuration: 0, models: {} };
          }
          dailyTotals[dateKey].providers[provider].requests += stat.requests;
          dailyTotals[dateKey].providers[provider].cost += stat.cost;
          dailyTotals[dateKey].providers[provider].totalDuration += stat.totalDuration;

          for (const [model, modelStat] of Object.entries(stat.models)) {
            if (!dailyTotals[dateKey].providers[provider].models[model]) {
              dailyTotals[dateKey].providers[provider].models[model] = { requests: 0, cost: 0, totalDuration: 0 };
            }
            dailyTotals[dateKey].providers[provider].models[model].requests += modelStat.requests;
            dailyTotals[dateKey].providers[provider].models[model].cost += modelStat.cost;
            dailyTotals[dateKey].providers[provider].models[model].totalDuration += modelStat.totalDuration;
          }
        }
      }
    }
  }

  return { dailyTotals, overallTotal };
}

export async function copyUsageStatsToSheets(
  stats: DailyUsageStats[]
): Promise<string> {
  const dates = [...new Set(stats.map((s) => s.date))].sort();
  const firstDate = dates[0] || "";

  const grouped = new Map<
    string,
    {
      username: string;
      project: string;
      provider: string;
      total: number;
    }
  >();

  for (const row of stats) {
    const username = row.user_email;
    const project = row.project || "-";
    const provider = row.provider;

    const key = JSON.stringify([username, project, provider]);

    if (!grouped.has(key)) {
      grouped.set(key, {
        username,
        project,
        provider,
        total: 0,
      });
    }

    const entry = grouped.get(key)!;
    entry.total += row.total_cost || 0;
  }

  // Format cost using comma decimal separator and $ suffix
  const formatCost = (value: number) =>
    `${value.toLocaleString("pl-PL", {
      useGrouping: false,
      maximumFractionDigits: 10,
    })}`;

  // Prevent tabs/newlines from breaking the spreadsheet structure
  const clean = (value: string) =>
    value.replace(/[\t\r\n]/g, " ");

  const headers = [
    "user_email",
    "project",
    "provider",
    firstDate,
  ];

  const lines = [headers.join("\t")];

  for (const entry of grouped.values()) {
    const row = [
      clean(entry.username),
      clean(entry.project),
      clean(entry.provider),
      formatCost(entry.total),
    ];

    lines.push(row.join("\t"));
  }

  const tsv = lines.join("\n");

  await navigator.clipboard.writeText(tsv);

  return tsv;
}