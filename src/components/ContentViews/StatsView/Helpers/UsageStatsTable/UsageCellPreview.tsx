import React, { useId } from "react";
import { Table, OverlayTrigger, Popover } from "react-bootstrap";

export type ModelStat = {
    requests: number;
    cost: number;
    totalDuration: number;
};

export type ProviderStat = {
    requests: number;
    cost: number;
    totalDuration: number;
    models: Record<string, ModelStat>;
};

export type UsageSummary = {
    totalRequests: number;
    totalCost: number;
    totalDuration: number;
    providers: Record<string, ProviderStat>;
    date?: string;
    userEmail?: string;
};

interface UsageCellPreviewProps {
    summary?: UsageSummary;
    emptyLabel?: React.ReactNode;
}

export function formatCost(cost: number): string {
    return `$${cost.toFixed(2)}`;
}

export function formatDuration(totalDuration: number, totalRequests: number): string {
    if (!totalRequests) return "0.00s";
    const avg = totalDuration / totalRequests;
    return `${avg.toFixed(2)}s`;
}

interface SummaryCellProps extends React.HTMLAttributes<HTMLDivElement> {
    summary: UsageSummary;
    hasProviders: boolean;
}

export const SummaryCell = React.forwardRef<HTMLDivElement, SummaryCellProps>(
    ({ summary, hasProviders, className = "", style, ...props }, ref) => {
        return (
            <div
                ref={ref}
                {...props}
                className={`d-flex align-items-center justify-content-between gap-2 w-100 px-2 py-1 rounded-1 ${
                    hasProviders ? "user-select-none" : ""
                } ${className}`}
                style={{
                    cursor: hasProviders ? "pointer" : "default",
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                <span className="text-nowrap text-warning fw-bold small">
                    {summary.totalRequests} reqs
                </span>
                <span className="text-nowrap text-success fw-bold small">
                    {formatCost(summary.totalCost)}
                </span>
            </div>
        );
    }
);

SummaryCell.displayName = "SummaryCell";

interface StatsPopUpProps extends React.ComponentPropsWithoutRef<typeof Popover> {
    summary: UsageSummary;
}

/**
 * Floating Popover showing detailed provider and model breakdown.
 * Uses forwardRef so OverlayTrigger can directly inject position styles & refs.
 */
export const StatsPopUp = React.forwardRef<HTMLDivElement, StatsPopUpProps>(
    ({ summary, id, className = "", style, ...props }, ref) => {
        const metadataLabel = [summary.userEmail, summary.date]
            .filter(Boolean)
            .join(" • ");

        return (
            <Popover
                id={id}
                ref={ref}
                className={`shadow-lg border-secondary-subtle ${className}`}
                style={{
                    maxWidth: "fit-content", // Overrides default 276px Bootstrap limit
                    ...style,                // Preserves Popper positioning styles passed by OverlayTrigger
                }}
                {...props}
            >
                <Popover.Header as="h6" className="fw-bold py-2 px-3 d-flex justify-content-between align-items-center">
                    <div>
                        <div>Provider Breakdown</div>
                        {metadataLabel && (
                            <div className="text-muted fw-normal small" style={{ fontSize: "0.75rem" }}>
                                {metadataLabel}
                            </div>
                        )}
                    </div>
                    <span className="badge bg-secondary ms-2">{summary.totalRequests} reqs</span>
                </Popover.Header>
                <Popover.Body className="p-2 overflow-auto" style={{ maxHeight: "400px" }}>
                    <Table striped bordered hover size="sm" className="m-0 small">
                        <thead>
                            <tr className="text-muted small">
                                <th>Provider / Model</th>
                                <th className="text-end">Reqs</th>
                                <th className="text-end">Avg Time</th>
                                <th className="text-end">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(summary.providers).map(([provider, providerStat]) => {
                                const hasModels = Object.keys(providerStat.models || {}).length > 0;

                                return (
                                    <React.Fragment key={provider}>
                                        <tr>
                                            <td className="text-capitalize fw-semibold text-secondary">
                                                {provider}
                                            </td>
                                            <td className="text-end text-nowrap">
                                                {providerStat.requests}
                                            </td>
                                            <td className="text-end text-nowrap">
                                                {formatDuration(providerStat.totalDuration, providerStat.requests)}
                                            </td>
                                            <td className="text-end text-nowrap text-success fw-semibold">
                                                {formatCost(providerStat.cost)}
                                            </td>
                                        </tr>

                                        {/* Models Breakdown */}
                                        {hasModels &&
                                            Object.entries(providerStat.models).map(([model, modelStat]) => (
                                                <tr key={`${provider}-${model}`}>
                                                    <td className="ps-3 text-nowrap text-muted small fst-italic">
                                                        ↳ {model}
                                                    </td>
                                                    <td className="text-end text-nowrap text-muted small">
                                                        {modelStat.requests}
                                                    </td>
                                                    <td className="text-end text-nowrap text-muted small">
                                                        {formatDuration(modelStat.totalDuration, modelStat.requests)}
                                                    </td>
                                                    <td className="text-end text-nowrap text-muted small">
                                                        {formatCost(modelStat.cost)}
                                                    </td>
                                                </tr>
                                            ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </Table>
                </Popover.Body>
            </Popover>
        );
    }
);

StatsPopUp.displayName = "StatsPopUp";



export const UsageCellPreview: React.FC<UsageCellPreviewProps> = ({
    summary,
    emptyLabel = <span className="text-muted">-</span>,
}) => {
    const popoverId = useId();

    if (!summary || summary.totalRequests === 0) {
        return <>{emptyLabel}</>;
    }

    const hasProviders = summary.providers && Object.keys(summary.providers).length > 0;
    const summaryCell = <SummaryCell summary={summary} hasProviders={hasProviders} />;

    if (hasProviders) {
        return (
            <OverlayTrigger
                trigger={["hover", "focus"]}
                delay={{ show: 150, hide: 150 }}
                placement="auto"
                overlay={<StatsPopUp id={popoverId} summary={summary} />}
            >
                {summaryCell}
            </OverlayTrigger>
        );
    }

    return summaryCell;
};