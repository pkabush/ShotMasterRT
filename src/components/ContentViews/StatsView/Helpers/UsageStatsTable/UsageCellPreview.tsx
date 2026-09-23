import React from "react";
import { Table } from "react-bootstrap";

export type ProviderStat = {
  requests: number;
  cost: number;
};

export type UsageSummary = {
  totalRequests: number;
  totalCost: number;
  providers: Record<string, ProviderStat>;
};

interface UsageCellPreviewProps {
  summary?: UsageSummary;
  emptyLabel?: React.ReactNode;
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export const UsageCellPreview: React.FC<UsageCellPreviewProps> = ({
  summary,
  emptyLabel = <span className="text-muted">-</span>,
}) => {
  if (!summary || summary.totalRequests === 0) {
    return <>{emptyLabel}</>;
  }

  return (
    <Table striped bordered hover size="sm" className="m-0 align-middle">

      <tbody>
        {/* Total Summary Row */}
        <tr className="fw-bold">
          <td>Total</td>
          <td className="text-end text-nowrap">{summary.totalRequests} reqs</td>
          <td className="text-end text-nowrap">{formatCost(summary.totalCost)}</td>
        </tr>

        {/* Provider Breakdown Rows */}
        {Object.entries(summary.providers).map(([provider, providerStat]) => (
          <tr key={provider}>
            
            {/* Added ps-3 for indentation offset */}
            <td className="text-capitalize text-nowrap ps-3 text-secondary small">
              {provider}
            </td>
            <td className="text-end text-nowrap text-secondary small">
              {providerStat.requests} reqs
            </td>
            <td className="text-end text-nowrap text-secondary small">
              {formatCost(providerStat.cost)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};