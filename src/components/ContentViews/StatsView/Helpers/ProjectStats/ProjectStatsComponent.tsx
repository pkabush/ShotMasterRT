import { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Form, Stack, Table } from "react-bootstrap";
import { getFromWorker } from "../../../../../classes/CloudflareWorker/WorkerUtils";
import { StatsPopUp, UsageCellPreview, type UsageSummary } from "../UsageStatsTable/UsageCellPreview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faPeopleGroup, faRefresh, faTrash } from "@fortawesome/free-solid-svg-icons";

export type TotalUsageStats = {
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

// Module-level cache
let cachedStats: TotalUsageStats[] | null = null;

export const getProjectStats = async (forceRefresh = false) => {
    if (cachedStats && !forceRefresh) {
        return cachedStats;
    }
    const response = await getFromWorker("stats/total");
    cachedStats = response.data;
    return cachedStats;
};

export const clearProjectStatsCache = () => {
    cachedStats = null;
};


export const ProjectStatsComponent = () => {
    const [totalStatsRaw, setTotalStats] = useState<TotalUsageStats[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showRequestsNumber, setShowRequestsNumber] = useState(false);

    const refreshProjects = async (forceRefresh = false) => {
        setLoading(true);

        try {
            const data = await getProjectStats(forceRefresh) ?? [];
            console.log(data);

            setTotalStats(data);

            const availableProjects = Array.from(
                new Set(
                    data
                        .map(stat => stat.project)
                        .filter((project): project is string =>
                            Boolean(project?.trim())
                        )
                )
            ).sort();

            const aliasedProjects = availableProjects.map(
                project => aliases[project] || project
            );

            setSelectedProject(current =>
                aliasedProjects.includes(current)
                    ? current
                    : aliasedProjects[0] ?? ""
            );
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { refreshProjects(); }, []);

    const [aliases, setAliases] = useState<Record<string, string>>(() => {
        try {
            return JSON.parse(localStorage.getItem("project_aliases") || "{}");
        } catch {
            return {};
        }
    });

    const saveAlias = (project: string, alias: string) => {
        setAliases(current => {
            const updated = { ...current };

            if (alias === project) {
                delete updated[project];
            } else {
                updated[project] = alias;
            }

            localStorage.setItem("project_aliases", JSON.stringify(updated));

            return updated;
        });
    };

    const projectsAliasedToSelected = useMemo(
        () =>
            Object.entries(aliases)
                .filter(([, alias]) => alias === selectedProject)
                .map(([project]) => project)
                .sort(),
        [aliases, selectedProject]
    );

    const totalStats = useMemo(
        () =>
            totalStatsRaw.map(stat => ({
                ...stat,
                project: stat.project
                    ? aliases[stat.project] || stat.project
                    : null,
            })),
        [totalStatsRaw, aliases]
    );

    const projects = useMemo(
        () =>
            Array.from(
                new Set(
                    totalStats
                        .map((stat) => stat.project)
                        .filter((project): project is string => Boolean(project?.trim()))
                )
            ).sort(),
        [totalStats]
    );

    const projectStats = useMemo(
        () => totalStats.filter((stat) => stat.project === selectedProject),
        [totalStats, selectedProject]
    );

    const projectsSortedByCost = useMemo(() => {
        return [...projects].sort((a, b) => {
            const costA = totalStats
                .filter(stat => stat.project === a)
                .reduce((sum, stat) => sum + stat.total_cost, 0);

            const costB = totalStats
                .filter(stat => stat.project === b)
                .reduce((sum, stat) => sum + stat.total_cost, 0);

            return costB - costA; // Highest cost first
        });
    }, [projects, totalStats]);

    const projectMetrics = useMemo(() => ({
        totalSpend: projectStats.reduce((sum, stat) => sum + (stat.total_cost || 0), 0),
        numberOfUsers: new Set(projectStats.map(stat => stat.user_email)).size,
    }), [projectStats]);

    const projectSummary = useMemo(
        () => buildProjectSummary(projectStats),
        [projectStats]
    );

    const userStats = useMemo(() => {
        const grouped = Object.groupBy(
            projectStats,
            (stat) => stat.user_email
        );

        return Object.entries(grouped)
            .map(([email, stats]) => ({
                email,
                summary: buildProjectSummary(stats ?? []),
            }))
            .sort((a, b) => a.email.localeCompare(b.email));
    }, [projectStats]);

    const projectDateRange = useMemo(() => {
        if (projectStats.length === 0) {
            return null;
        }

        const dates = projectStats.map(stat => stat.date).sort();

        return {
            startDate: dates[0],
            endDate: dates[dates.length - 1],
        };
    }, [projectStats]);

    const weeklyCostTable = useMemo(() => {
        const dates = Array.from(
            new Set(projectStats.map(stat => stat.date))
        ).sort();

        const grouped = new Map<string, Record<string, UsageSummary>>();

        for (const stat of projectStats) {
            if (!grouped.has(stat.user_email)) {
                grouped.set(stat.user_email, {});
            }

            const userDates = grouped.get(stat.user_email)!;

            if (!userDates[stat.date]) {
                userDates[stat.date] = {
                    totalRequests: 0,
                    totalCost: 0,
                    totalDuration: 0,
                    providers: {},
                    userEmail: stat.user_email,
                    date: stat.date,
                };
            }

            const summary = userDates[stat.date];
            const requests = stat.number_of_requests || 0;
            const cost = stat.total_cost || 0;
            const duration = (stat.average_req_duration || 0) * requests;
            const model = stat.model || "Unknown";

            summary.totalRequests += requests;
            summary.totalCost += cost;
            summary.totalDuration += duration;

            if (!summary.providers[stat.provider]) {
                summary.providers[stat.provider] = {
                    requests: 0,
                    cost: 0,
                    totalDuration: 0,
                    models: {},
                };
            }

            const provider = summary.providers[stat.provider];

            provider.requests += requests;
            provider.cost += cost;
            provider.totalDuration += duration;

            if (!provider.models[model]) {
                provider.models[model] = {
                    requests: 0,
                    cost: 0,
                    totalDuration: 0,
                };
            }

            provider.models[model].requests += requests;
            provider.models[model].cost += cost;
            provider.models[model].totalDuration += duration;
        }

        const rows = Array.from(grouped.entries())
            .map(([email, daily]) => {
                const total: UsageSummary = {
                    totalRequests: 0,
                    totalCost: 0,
                    totalDuration: 0,
                    providers: {},
                    userEmail: email,
                };

                for (const date of dates) {
                    const summary = daily[date];
                    if (!summary) continue;

                    total.totalRequests += summary.totalRequests;
                    total.totalCost += summary.totalCost;
                    total.totalDuration += summary.totalDuration;

                    for (const [providerName, provider] of Object.entries(summary.providers)) {
                        if (!total.providers[providerName]) {
                            total.providers[providerName] = {
                                requests: 0,
                                cost: 0,
                                totalDuration: 0,
                                models: {},
                            };
                        }

                        const target = total.providers[providerName];

                        target.requests += provider.requests;
                        target.cost += provider.cost;
                        target.totalDuration += provider.totalDuration;

                        for (const [modelName, model] of Object.entries(provider.models)) {
                            if (!target.models[modelName]) {
                                target.models[modelName] = {
                                    requests: 0,
                                    cost: 0,
                                    totalDuration: 0,
                                };
                            }

                            target.models[modelName].requests += model.requests;
                            target.models[modelName].cost += model.cost;
                            target.models[modelName].totalDuration += model.totalDuration;
                        }
                    }
                }

                return { email, daily, total };
            })
            .sort((a, b) => a.email.localeCompare(b.email));

        // Helper to aggregate a summary, including providers and models
        const addSummary = (target: UsageSummary, source: UsageSummary) => {
            target.totalRequests += source.totalRequests;
            target.totalCost += source.totalCost;
            target.totalDuration += source.totalDuration;

            for (const [providerName, provider] of Object.entries(source.providers)) {
                if (!target.providers[providerName]) {
                    target.providers[providerName] = {
                        requests: 0,
                        cost: 0,
                        totalDuration: 0,
                        models: {},
                    };
                }

                const targetProvider = target.providers[providerName];

                targetProvider.requests += provider.requests;
                targetProvider.cost += provider.cost;
                targetProvider.totalDuration += provider.totalDuration;

                for (const [modelName, model] of Object.entries(provider.models)) {
                    if (!targetProvider.models[modelName]) {
                        targetProvider.models[modelName] = {
                            requests: 0,
                            cost: 0,
                            totalDuration: 0,
                        };
                    }

                    targetProvider.models[modelName].requests += model.requests;
                    targetProvider.models[modelName].cost += model.cost;
                    targetProvider.models[modelName].totalDuration += model.totalDuration;
                }
            }
        };

        // Weekly totals
        const weeklyTotals: Record<string, UsageSummary> = {};

        for (const date of dates) {
            weeklyTotals[date] = {
                totalRequests: 0,
                totalCost: 0,
                totalDuration: 0,
                providers: {},
                date,
                userEmail: "Weekly Total",
            };
        }

        // Grand total
        const grandTotal: UsageSummary = {
            totalRequests: 0,
            totalCost: 0,
            totalDuration: 0,
            providers: {},
            userEmail: "Grand Total",
        };

        for (const row of rows) {
            addSummary(grandTotal, row.total);

            for (const date of dates) {
                const summary = row.daily[date];

                if (summary) {
                    addSummary(weeklyTotals[date], summary);
                }
            }
        }

        return {
            dates,
            rows,
            weeklyTotals,
            grandTotal,
        };
    }, [projectStats]);


    const copyWeeklyStats = async () => {
        const providers = ["Seedance", "gpt", "gemini", "kling"];

        const grouped = new Map<
            string,
            {
                user_email: string;
                provider: string;
                costs: Record<string, number>;
            }
        >();

        // Create an entry for every user/provider combination
        const users = [...new Set(projectStats.map(stat => stat.user_email))];

        for (const email of users) {
            for (const provider of providers) {
                grouped.set(`${email}|${provider}`, {
                    user_email: email,
                    provider,
                    costs: {},
                });
            }
        }

        // Populate actual costs
        for (const stat of projectStats) {
            const key = `${stat.user_email}|${stat.provider}`;

            // Also preserve any provider not in the predefined list
            if (!grouped.has(key)) {
                grouped.set(key, {
                    user_email: stat.user_email,
                    provider: stat.provider,
                    costs: {},
                });
            }

            const row = grouped.get(key)!;

            row.costs[stat.date] =
                (row.costs[stat.date] || 0) + (stat.total_cost || 0);
        }

        const rows = Array.from(grouped.values()).sort(
            (a, b) =>
                a.user_email.localeCompare(b.user_email) ||
                providers.indexOf(a.provider) - providers.indexOf(b.provider)
        );

        const headers = [
            "Username",
            "Project",
            "Provider",
            ...weeklyCostTable.dates.map((_, index) => `W${index + 1}`),
        ];

        const dateHeaders = [
            "",
            "",
            "",
            ...weeklyCostTable.dates,
        ];

        const dataRows = rows.map(row => [
            row.user_email,
            selectedProject || "",
            row.provider,
            ...weeklyCostTable.dates.map(date => {
                const cost = row.costs[date] || 0;
                return cost === 0 ? "" : cost.toFixed(2);
            }),
        ]);

        const tsv = [headers, dateHeaders, ...dataRows]
            .map(row => row.join("\t"))
            .join("\n");

        try {
            await navigator.clipboard.writeText(tsv);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy weekly stats:", error);
        }
    };

    const usersByAliasedProject = useMemo(() => {
        return projectsAliasedToSelected.map(project => ({
            project,
            users: Array.from(
                new Set(
                    totalStatsRaw
                        .filter(stat => stat.project === project)
                        .map(stat => stat.user_email)
                )
            ).sort(),
        }));
    }, [projectsAliasedToSelected, totalStatsRaw]);

    return <>
        <Stack direction="horizontal" gap={0}>

            <Stack direction="horizontal" gap={0}>
                <Dropdown>
                    <Dropdown.Toggle
                        size="sm"
                        variant="outline-secondary"
                        style={{ width: "320px", textAlign: "left" }}
                        className="d-flex align-items-center justify-content-between"
                    >
                        <span className="text-truncate">
                            {selectedProject || "Select a project"}
                        </span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu
                        style={{
                            minWidth: "420px",
                            "--bs-dropdown-link-active-bg": "#23302b",
                            "--bs-dropdown-link-active-color": "#fff",
                        } as React.CSSProperties}
                    >
                        {projectsSortedByCost.map(project => {
                            const stats = totalStats.filter(stat => stat.project === project);
                            const spend = stats.reduce((sum, stat) => sum + (stat.total_cost || 0), 0);
                            const users = new Set(stats.map(stat => stat.user_email)).size;

                            return (
                                <Dropdown.Item
                                    key={project}
                                    active={selectedProject === project}
                                    onClick={() => setSelectedProject(project)}
                                >
                                    <Stack direction="horizontal" gap={3}>
                                        <span className="text-truncate flex-grow-1">
                                            {project}
                                        </span>

                                        <span className="text-success text-nowrap">
                                            ${spend.toFixed(2)}
                                        </span>

                                        <span className="text-warning text-nowrap">
                                            <FontAwesomeIcon icon={faPeopleGroup} className="me-1" />
                                            {users}
                                        </span>
                                    </Stack>
                                </Dropdown.Item>
                            );
                        })}
                    </Dropdown.Menu>
                </Dropdown>

            </Stack>

            <Button
                size="sm"
                variant="outline-warning"
                onClick={() => refreshProjects(true)}
                disabled={loading}
            >
                <FontAwesomeIcon icon={faRefresh} />
            </Button>
        </Stack>

        {selectedProject && (
            <Stack direction="horizontal" gap={3} className="mt-2 mb-2 align-items-center">
                <h2 className="mb-0">{selectedProject}</h2>

                <span className="text-success" >
                    <strong>${projectMetrics.totalSpend.toFixed(2)}</strong>
                </span>

                <span className="text-warning">
                    <FontAwesomeIcon icon={faPeopleGroup} />
                    <strong>{projectMetrics.numberOfUsers}</strong>
                </span>

                {projectDateRange && (
                    <span className="text-muted small">
                        {projectDateRange.startDate} – {projectDateRange.endDate}
                    </span>
                )}
            </Stack>
        )}


        {selectedProject && (
            <StatsPopUp id={"test"} summary={projectSummary} />
        )}

        {false && selectedProject && (
            <h4 className="mt-3">User Stats</h4>
        )}

        {false && selectedProject && (
            <Table striped bordered hover size="sm" className="mt-3">

                <tbody>
                    {/* Individual users */}
                    {userStats.map((user) => (
                        <tr key={user.email}>
                            <td className="align-middle">
                                {user.email}
                            </td>
                            <td className="p-0 align-middle">
                                <UsageCellPreview summary={user.summary} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        )}


        {selectedProject && (
            <Stack
                direction="horizontal"
                gap={2}
                className="mt-3 align-items-center"
            >
                <h4 className="mb-0">Weekly Stats</h4>

                <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={copyWeeklyStats}
                    disabled={weeklyCostTable.rows.length === 0}
                >
                    <FontAwesomeIcon
                        icon={copied ? faCheck : faCopy}
                        className="me-2"
                    />
                    {copied ? "Copied!" : "Copy to Sheets"}
                </Button>

                <Form.Check
                    type="switch"
                    id="show-requests-number"
                    label="Show requests"
                    checked={showRequestsNumber}
                    onChange={(e) => setShowRequestsNumber(e.target.checked)}
                    className="ms-2 mb-0"
                />
            </Stack>
        )}

        {selectedProject && (
            <div
                className="mt-4"
                style={{
                    width: "fit-content",
                    maxWidth: "100%",
                    overflowX: "auto",
                    position: "relative",
                }}
            >
                <Table
                    striped
                    bordered
                    hover
                    size="sm"
                    className="align-top mb-0"
                    style={{
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        width: "max-content",
                        minWidth: "0",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                rowSpan={2}
                                style={{
                                    position: "sticky",
                                    left: 0,
                                    minWidth: 200,
                                    zIndex: 5,
                                    background: "var(--bs-table-bg)",
                                }}
                            >
                                User
                            </th>

                            {weeklyCostTable.dates.map((date, index) => (
                                <th
                                    key={date}
                                    className="text-center"
                                >
                                    W{index + 1}
                                </th>
                            ))}

                            <th
                                rowSpan={2}
                                className="text-center align-middle"
                                style={{
                                    position: "sticky",
                                    right: 0,
                                    zIndex: 5,
                                    background: "var(--bs-table-bg)",
                                }}
                            >
                                Total
                            </th>
                        </tr>

                        <tr>
                            {weeklyCostTable.dates.map(date => (
                                <th
                                    key={date}
                                    className="text-center text-nowrap"
                                    style={{ width: "65px", minWidth: "65px", fontSize: "0.75rem" }}
                                    title={new Date(date).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    }).replace(/\//g, ".")}
                                >
                                    {new Date(date).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "2-digit",
                                    }).replace(/\//g, ".")}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {weeklyCostTable.rows.map(row => (
                            <tr key={row.email}>
                                <td
                                    className="text-nowrap fw-bold align-middle"
                                    style={{
                                        position: "sticky",
                                        left: 0,
                                        minWidth: 20,
                                        zIndex: 2,
                                        background: "var(--bs-table-bg)",
                                    }}
                                >
                                    {row.email}
                                </td>

                                {weeklyCostTable.dates.map(date => (
                                    <td
                                        key={date}
                                        className="p-0 align-middle"
                                    >
                                        <UsageCellPreview
                                            summary={row.daily[date]}
                                            show_requests_number={showRequestsNumber}
                                        />
                                    </td>
                                ))}

                                <td
                                    className="p-0 align-middle"
                                    style={{
                                        position: "sticky",
                                        right: 0,
                                        zIndex: 2,
                                        background: "var(--bs-table-bg)",
                                    }}
                                >
                                    <UsageCellPreview
                                        summary={row.total}
                                        show_requests_number={showRequestsNumber}
                                    />
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
                                    right: 0,
                                    zIndex: 3,
                                }}
                            >
                                Weekly Total
                            </td>

                            {weeklyCostTable.dates.map(date => (
                                <td
                                    key={date}
                                    className="p-0 align-middle"
                                >
                                    <UsageCellPreview
                                        summary={weeklyCostTable.weeklyTotals[date]}
                                        show_requests_number={showRequestsNumber}
                                    />
                                </td>
                            ))}

                            <td
                                className="p-0 align-middle table-dark"
                                style={{
                                    position: "sticky",
                                    right: 0,
                                    minWidth: 200,
                                    zIndex: 3,
                                }}
                            >
                                <UsageCellPreview
                                    summary={weeklyCostTable.grandTotal}
                                    show_requests_number={showRequestsNumber}
                                />
                            </td>
                        </tr>
                    </tfoot>
                </Table>
            </div>
        )}



        {selectedProject && (
            <>
                <hr className="my-4" />

                <Stack gap={3} style={{ maxWidth: "600px" }}>
                    <h5 className="mb-0">Project aliases</h5>

                    {projectsAliasedToSelected.length > 0 ? (
                        <>
                            <small className="text-muted">
                                The following projects are using {selectedProject} as their alias.
                            </small>

                            {usersByAliasedProject.map(({ project, users }) => (
                                <div
                                    key={project}
                                    className="border rounded p-2"
                                >
                                    <Stack
                                        direction="horizontal"
                                        gap={2}
                                        className="align-items-center"
                                    >
                                        <strong className="flex-grow-1">
                                            {project}
                                        </strong>

                                        <span className="text-warning text-nowrap small">
                                            <FontAwesomeIcon
                                                icon={faPeopleGroup}
                                                className="me-1"
                                            />
                                            {users.length} users
                                        </span>

                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => saveAlias(project, project)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </Button>
                                    </Stack>

                                    <div className="mt-2">
                                        {users.length > 0 ? (
                                            <Stack gap={1}>
                                                {users.map(user => (
                                                    <small
                                                        key={user}
                                                        className="text-muted"
                                                    >
                                                        {user}
                                                    </small>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <small className="text-muted">
                                                No users found
                                            </small>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <small className="text-muted">
                                Select another project to make it use {selectedProject} as its alias.
                            </small>

                            <Form.Select
                                size="sm"
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        saveAlias(selectedProject, e.target.value);
                                        setSelectedProject(e.target.value);
                                    }
                                }}
                            >
                                <option value="">Select a project...</option>

                                {Object.keys(aliases)
                                    .filter(project => project !== selectedProject)
                                    .map(project => (
                                        <option key={project} value={project}>
                                            {project}
                                        </option>
                                    ))}

                                {projects
                                    .filter(project =>
                                        project !== selectedProject &&
                                        !Object.keys(aliases).includes(project)
                                    )
                                    .map(project => (
                                        <option key={project} value={project}>
                                            {project}
                                        </option>
                                    ))}
                            </Form.Select>
                        </>
                    )}
                </Stack>
            </>
        )}


    </>;
}

function buildProjectSummary(stats: TotalUsageStats[]): UsageSummary {
    const summary: UsageSummary = {
        totalRequests: 0,
        totalCost: 0,
        totalDuration: 0,
        providers: {},
        userEmail: "Project total",
    };

    for (const row of stats) {
        const requests = row.number_of_requests || 0;
        const cost = row.total_cost || 0;
        const duration = (row.average_req_duration || 0) * requests;
        const model = row.model || "Unknown";
        const provider = row.provider;

        summary.totalRequests += requests;
        summary.totalCost += cost;
        summary.totalDuration += duration;

        if (!summary.providers[provider]) {
            summary.providers[provider] = {
                requests: 0,
                cost: 0,
                totalDuration: 0,
                models: {},
            };
        }

        const providerStat = summary.providers[provider];

        providerStat.requests += requests;
        providerStat.cost += cost;
        providerStat.totalDuration += duration;

        if (!providerStat.models[model]) {
            providerStat.models[model] = {
                requests: 0,
                cost: 0,
                totalDuration: 0,
            };
        }

        providerStat.models[model].requests += requests;
        providerStat.models[model].cost += cost;
        providerStat.models[model].totalDuration += duration;
    }

    return summary;
}