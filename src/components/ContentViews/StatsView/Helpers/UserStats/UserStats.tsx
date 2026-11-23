
import { useEffect, useState } from "react";
import {
    Button,
    Spinner,
    Table,
    Stack,
    Form,
    Modal
} from "react-bootstrap";
import * as ContextMenu from "@radix-ui/react-context-menu";

import {
    getFromWorker,
    patchToWorker
} from "../../../../../classes/CloudflareWorker/WorkerUtils";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

type TotalUserStats = {
    google_user_id: string;
    user_email: string;
    user_name: string | null;
    total_spend: number;
    total_requests: number;
    cost_limit: number;
    remaining_limit: number;
    is_deactivated: boolean;
    is_admin: boolean;
};

export const TotalUserStatsComponent = () => {
    const [users, setUsers] = useState<TotalUserStats[]>([]);
    const [loading, setLoading] = useState(true);

    // Limit dialog
    const [editingUser, setEditingUser] = useState<TotalUserStats | null>(null);
    const [limitDraft, setLimitDraft] = useState("");
    const [savingLimit, setSavingLimit] = useState(false);

    const refresh = async () => {
        setLoading(true);

        try {
            const response = await getFromWorker("stats/users");
            setUsers(response.data ?? []);
        } catch (err) {
            console.error("Failed to load user stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    // Open limit dialog
    const openLimitDialog = (user: TotalUserStats) => {
        setEditingUser(user);
        setLimitDraft(String(user.cost_limit));
    };

    // Save user limit
    const handleLimitSave = async () => {
        if (!editingUser) return;

        const newLimit = Number(limitDraft);

        if (!Number.isFinite(newLimit) || newLimit < 0) {
            return;
        }

        const userId = editingUser.google_user_id;

        setSavingLimit(true);

        try {
            await patchToWorker(
                { cost_limit: newLimit },
                `stats/users/${encodeURIComponent(userId)}/limit`
            );

            setUsers(prev =>
                prev.map(user =>
                    user.google_user_id === userId
                        ? {
                            ...user,
                            cost_limit: newLimit,
                            remaining_limit: Math.max(
                                0,
                                newLimit - user.total_spend
                            )
                        }
                        : user
                )
            );

            setEditingUser(null);

        } catch (err) {
            console.error("Failed to update user limit:", err);
            await refresh();
        } finally {
            setSavingLimit(false);
        }
    };

    // Activate / deactivate user
    const handleDeactivatedChange = async (
        userId: string,
        isDeactivated: boolean
    ) => {
        const previousValue = users.find(
            user => user.google_user_id === userId
        )?.is_deactivated;

        // Optimistic update
        setUsers(prev =>
            prev.map(user =>
                user.google_user_id === userId
                    ? { ...user, is_deactivated: isDeactivated }
                    : user
            )
        );

        try {
            await patchToWorker(
                { is_deactivated: isDeactivated },
                `stats/users/${encodeURIComponent(userId)}/deactivated`
            );
        } catch (err) {
            console.error("Failed to update user deactivation:", err);

            // Rollback
            if (previousValue !== undefined) {
                setUsers(prev =>
                    prev.map(user =>
                        user.google_user_id === userId
                            ? { ...user, is_deactivated: previousValue }
                            : user
                    )
                );
            }
        }
    };

    const totalSpend = users.reduce(
        (sum, user) => sum + user.total_spend, 0
    );

    const totalRequests = users.reduce(
        (sum, user) => sum + user.total_requests, 0
    );

    return (
        <>
            <Stack direction="horizontal" gap={2} className="mb-3">
                <h5 className="mb-0 flex-grow-1">
                    User statistics
                </h5>

                <Button
                    size="sm"
                    variant="outline-warning"
                    onClick={refresh}
                    disabled={loading}
                >
                    <FontAwesomeIcon icon={faRefresh} />
                </Button>
            </Stack>

            {/* Summary */}
            <div className="d-flex gap-4 mb-3">
                <div>
                    <small className="text-muted">Total spend</small>
                    <div className="text-success fw-bold">
                        ${totalSpend.toFixed(2)}
                    </div>
                </div>

                <div>
                    <small className="text-muted">Total requests</small>
                    <div className="fw-bold">
                        {totalRequests.toLocaleString()}
                    </div>
                </div>

                <div>
                    <small className="text-muted">Users</small>
                    <div className="fw-bold">
                        {users.length}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-4">
                    <Spinner animation="border" size="sm" />
                </div>
            ) : (
                <Table striped bordered hover responsive size="sm">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Spend</th>
                            <th>Requests</th>
                            <th>Limit</th>
                            <th>Remaining</th>
                            <th>Status</th>
                            <th>Admin</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map(user => (
                            <ContextMenu.Root key={user.google_user_id}>
                                <ContextMenu.Trigger asChild>
                                    <tr
                                        style={{ cursor: "context-menu" }}
                                        title="Right-click for user actions"
                                    >
                                        <td className="fw-semibold">
                                            {user.user_name || "Unknown"}
                                        </td>

                                        <td className="text-muted">
                                            {user.user_email}
                                        </td>

                                        <td className="text-nowrap">
                                            ${user.total_spend.toFixed(2)}
                                        </td>

                                        <td>
                                            {user.total_requests.toLocaleString()}
                                        </td>

                                        {/* Read-only limit */}
                                        <td className="text-nowrap">
                                            ${user.cost_limit.toFixed(2)}
                                        </td>

                                        <td className="text-nowrap">
                                            <span className={
                                                user.remaining_limit <= 0
                                                    ? "text-danger"
                                                    : "text-success"
                                            }>
                                                ${user.remaining_limit.toFixed(2)}
                                            </span>
                                        </td>

                                        {/* Read-only status */}
                                        <td>
                                            {user.is_deactivated ? (
                                                <span className="badge bg-danger">
                                                    Deactivated
                                                </span>
                                            ) : (
                                                <span className="badge bg-success">
                                                    Active
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            {user.is_admin ? (
                                                <span className="badge bg-warning text-dark">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                </ContextMenu.Trigger>

                                {/* User context menu */}
                                <ContextMenu.Portal>
                                    <ContextMenu.Content
                                        className="bg-body border rounded shadow p-1"
                                        style={{
                                            minWidth: 190,
                                            zIndex: 2000
                                        }}
                                    >
                                        <div className="px-3 py-2 small text-muted border-bottom mb-1">
                                            {user.user_email}
                                        </div>

                                        <ContextMenu.Item
                                            className="px-3 py-2 small rounded"
                                            style={{ cursor: "pointer" }}
                                            onSelect={() => openLimitDialog(user)}
                                        >
                                            Change spending limit
                                        </ContextMenu.Item>

                                        <ContextMenu.Separator className="border-top my-1" />

                                        <ContextMenu.Item
                                            className="px-3 py-2 small rounded"
                                            style={{ cursor: "pointer" }}
                                            onSelect={() =>
                                                handleDeactivatedChange(
                                                    user.google_user_id,
                                                    !user.is_deactivated
                                                )
                                            }
                                        >
                                            {user.is_deactivated
                                                ? "Activate account"
                                                : "Deactivate account"}
                                        </ContextMenu.Item>
                                    </ContextMenu.Content>
                                </ContextMenu.Portal>
                            </ContextMenu.Root>
                        ))}

                        {users.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center text-muted">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}

            {/* Change limit dialog */}
            <Modal
                show={!!editingUser}
                onHide={() => !savingLimit && setEditingUser(null)}
                centered
                size="sm"
            >
                <Modal.Header closeButton={!savingLimit}>
                    <Modal.Title className="fs-6">
                        Change spending limit
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {editingUser && (
                        <>
                            <div className="mb-3">
                                <div className="fw-semibold">
                                    {editingUser.user_name || "Unknown"}
                                </div>
                                <small className="text-muted">
                                    {editingUser.user_email}
                                </small>
                            </div>

                            <Form.Group>
                                <Form.Label>
                                    Spending limit (USD)
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={limitDraft}
                                    onChange={e =>
                                        setLimitDraft(e.target.value)
                                    }
                                    autoFocus
                                />
                            </Form.Group>

                            <div className="small text-muted mt-2">
                                Current spend: ${editingUser.total_spend.toFixed(2)}
                            </div>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingUser(null)}
                        disabled={savingLimit}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleLimitSave}
                        disabled={
                            savingLimit ||
                            limitDraft.trim() === "" ||
                            !Number.isFinite(Number(limitDraft)) ||
                            Number(limitDraft) < 0
                        }
                    >
                        {savingLimit ? (
                            <>
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                />
                                Saving...
                            </>
                        ) : (
                            "Save limit"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};
