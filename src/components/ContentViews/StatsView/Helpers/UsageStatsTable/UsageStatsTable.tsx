import React from "react";
import { Table } from "react-bootstrap";
import { UsageCellPreview, type UsageSummary } from "./UsageCellPreview";

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
  stats: DailyUsageStats[];
  dates: Date[];
}

export const UsageStatsTable: React.FC<UsageStatsTableProps> = ({ stats, dates }) => {
  const userStats = buildUserStats(stats, dates);
  const { dailyTotals, overallTotal } = calculateGrandTotals(userStats, dates);

  return (
    <div>
      <Table striped bordered hover responsive className="align-top">
        <thead>
          <tr>
            <th>Username</th>

            {dates.map((date) => (
              <th key={formatDateKey(date)} className="text-center">
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "numeric",
                  day: "numeric",
                })}
              </th>
            ))}

            <th className="text-center">Total</th>
          </tr>
        </thead>

        <tbody>
          {userStats.map((user) => (
            <tr key={user.email}>
              <td className="fw-bold align-middle">{user.email}</td>

              {/* User Daily Cells */}
              {dates.map((date) => {
                const dateKey = formatDateKey(date);
                const daySummary = user.daily[dateKey];

                return (
                  <td key={dateKey} className="p-0">
                    <UsageCellPreview
                      summary={daySummary}
                    />
                  </td>
                );
              })}

              {/* User Total Column */}
              <td className="p-0">
                <UsageCellPreview
                  summary={user.total}
                />
              </td>
            </tr>
          ))}
        </tbody>

        {/* Grand Totals Footer */}
        <tfoot>
          <tr className="table fw-bold">
            <td className="align-middle">Total</td>

            {/* Daily Grand Totals Across All Users */}
            {dates.map((date) => {
              const dateKey = formatDateKey(date);
              const dayGrandTotal = dailyTotals[dateKey];

              return (
                <td key={dateKey} className="p-0">
                  <UsageCellPreview
                    summary={dayGrandTotal}
                  />
                </td>
              );
            })}

            {/* All-time Grand Total */}
            <td className="p-0 table-dark">
              <UsageCellPreview
                summary={overallTotal}
              />
            </td>
          </tr>
        </tfoot>
      </Table>
    </div>
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