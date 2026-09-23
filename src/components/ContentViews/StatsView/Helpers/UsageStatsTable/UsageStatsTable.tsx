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

  return (
    <Table striped bordered hover responsive className="align-middle">
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
                  <UsageCellPreview summary={daySummary} />
                </td>
              );
            })}

            {/* User Row Total Column */}
            <td className="p-0">
              <UsageCellPreview summary={user.total} />
            </td>
          </tr>
        ))}
      </tbody>

    </Table>
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
        providers: {},
      };
    }

    const dayData = users[row.user_email][row.date];
    const requests = row.number_of_requests || 0;
    const cost = row.total_cost || 0;

    dayData.totalRequests += requests;
    dayData.totalCost += cost;

    if (!dayData.providers[row.provider]) {
      dayData.providers[row.provider] = { requests: 0, cost: 0 };
    }

    dayData.providers[row.provider].requests += requests;
    dayData.providers[row.provider].cost += cost;
  }

  return Object.entries(users).map(([email, daily]) => {
    const totalSummary: UsageSummary = {
      totalRequests: 0,
      totalCost: 0,
      providers: {},
    };

    for (const date of dates) {
      const dateKey = formatDateKey(date);
      const dayData = daily[dateKey];

      if (dayData) {
        totalSummary.totalRequests += dayData.totalRequests;
        totalSummary.totalCost += dayData.totalCost;

        for (const [provider, providerStat] of Object.entries(dayData.providers)) {
          if (!totalSummary.providers[provider]) {
            totalSummary.providers[provider] = { requests: 0, cost: 0 };
          }
          totalSummary.providers[provider].requests += providerStat.requests;
          totalSummary.providers[provider].cost += providerStat.cost;
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
    providers: {},
  };

  for (const date of dates) {
    const dateKey = formatDateKey(date);
    dailyTotals[dateKey] = {
      totalRequests: 0,
      totalCost: 0,
      providers: {},
    };
  }

  for (const user of userStats) {
    overallTotal.totalRequests += user.total.totalRequests;
    overallTotal.totalCost += user.total.totalCost;

    for (const [provider, stat] of Object.entries(user.total.providers)) {
      if (!overallTotal.providers[provider]) {
        overallTotal.providers[provider] = { requests: 0, cost: 0 };
      }
      overallTotal.providers[provider].requests += stat.requests;
      overallTotal.providers[provider].cost += stat.cost;
    }

    for (const date of dates) {
      const dateKey = formatDateKey(date);
      const dayData = user.daily[dateKey];

      if (dayData) {
        dailyTotals[dateKey].totalRequests += dayData.totalRequests;
        dailyTotals[dateKey].totalCost += dayData.totalCost;

        for (const [provider, stat] of Object.entries(dayData.providers)) {
          if (!dailyTotals[dateKey].providers[provider]) {
            dailyTotals[dateKey].providers[provider] = { requests: 0, cost: 0 };
          }
          dailyTotals[dateKey].providers[provider].requests += stat.requests;
          dailyTotals[dateKey].providers[provider].cost += stat.cost;
        }
      }
    }
  }

  return { dailyTotals, overallTotal };
}