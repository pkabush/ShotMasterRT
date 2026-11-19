import { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Form, Stack, Table } from "react-bootstrap";
import { getFromWorker } from "../../../../../classes/CloudflareWorker/WorkerUtils";
import { StatsPopUp, UsageCellPreview, type UsageSummary } from "../UsageStatsTable/UsageCellPreview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPeopleGroup, faRefresh, faTrash } from "@fortawesome/free-solid-svg-icons";

export type TotalUsageStats = {
    user_email: string;
    project: string | null;
    provider: string;
    model: string | null;
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

    const refreshProjects = async (forceRefresh = false) => {
        setLoading(true);

        try {
            const data = await getProjectStats(forceRefresh) ?? [];

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
                        {projects.map((project) => {
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
            </Stack>
        )}


        {selectedProject && (
            <StatsPopUp id={"test"} summary={projectSummary} />
        )}


        {selectedProject && (
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

        {selectedProject && <>
            <hr className="my-4" />

            <Stack gap={2} style={{ maxWidth: "420px" }}>
                <h5 className="mb-0">Project aliases</h5>

                {projectsAliasedToSelected.length > 0 ? (
                    <>
                        <small className="text-muted">
                            The following projects are using {selectedProject} as their alias.
                        </small>

                        {projectsAliasedToSelected.map(project => (
                            <Stack
                                key={project}
                                direction="horizontal"
                                gap={2}
                                className="align-items-center"
                            >
                                <span className="flex-grow-1">
                                    {project}
                                </span>

                                <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => {
                                        saveAlias(project, project)
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </Stack>
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
        </>}


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