import { action, makeObservable, observable, toJS } from "mobx";
import type { LocalJson } from "../LocalJson";

export type Provider = "Google" | "GPT" | "Seedance" | "Kling";

export type UsageTask = {
    id: string;
    provider: Provider;
    cost: number;
    data: Record<string, any>;
    timestamp: number;
};

export type UsageData = {
    tasks: UsageTask[];
};

export class CostTracker {
    dataJson: LocalJson | null = null;

    constructor(dataJson: LocalJson) {
        this.dataJson = dataJson;
        makeObservable(this, {
            dataJson: observable,
            addCost: action,
        });
    }

    get usage(): UsageData {
        const usageData = this.dataJson?.getField("usageData");
        if (!usageData || typeof usageData !== "object") {
            return { tasks: [], };
        }
        return usageData as UsageData;
    }

    set usage(usageData: UsageData) {
        this.dataJson?.updateField("usageData", usageData);
    }

    addCost(
        id: string,
        provider: Provider,
        cost: number,
        data: Record<string, any> = {}
    ) {
        if (Number.isNaN(cost)) {
            console.warn("Ignoring NaN cost", { id, provider, data });
            return;
        }

        console.log("COST NOTED", { id, provider, cost, data });
        const usage = this.usage;
        const timestamp = Date.now();
        const existingTask = id === ""
            ? undefined
            : usage.tasks.find(
                task => task.id === id && task.provider === provider
            );

        if (existingTask) {
            existingTask.cost = cost;
            existingTask.data = {
                ...existingTask.data,
                ...data,
            };
            existingTask.timestamp = timestamp;
        } else {
            usage.tasks.push({
                id,
                provider,
                cost,
                data,
                timestamp,
            });
        }

        this.usage = usage;
    }

    getTasksByProvider(provider: Provider): UsageTask[] {
        return this.usage.tasks.filter(
            task => task.provider === provider
        );
    }

    log() {
        console.log(toJS(this.usage));
    }

    getProviderData(provider: Provider): {
        tasks: UsageTask[];
        totalCost: number;
        taskCount: number;
    } {
        const tasks = this.getTasksByProvider(provider);

        return {
            tasks,
            totalCost: tasks.reduce((sum, task) => sum + task.cost, 0),
            taskCount: tasks.length,
        };
    }

    totalCost(): number {
        return this.usage.tasks.reduce(
            (sum, task) => sum + task.cost,
            0
        );
    }

    totalCostToday(): number {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayTimestamp = startOfToday.getTime();

        return this.usage.tasks
            .filter(task => task.timestamp >= todayTimestamp)
            .reduce((sum, task) => sum + task.cost, 0);
    }


    async getUsage(
        username: string = "username",
        project: string = "proj_name"
    ) {
        const tasks = this.usage.tasks.filter(
            task => typeof task.timestamp === "number" && task.timestamp > 0
        );

        if (tasks.length === 0) {
            console.log("No usage data");
            return "";
        }

        // Get unique providers automatically
        const providers = [...new Set(tasks.map(task => task.provider))];

        // Get unique weeks automatically
        const weeks = [...new Set(
            tasks.map(task => this.getWeekKey(task.timestamp))
        )].sort();

        // Header
        const header = [
            "Username",
            "Project",
            "Provider",
            ...weeks
        ].join("\t");

        const rows = providers.map(provider => {
            const weekCosts = weeks.map(week => {
                const cost = tasks
                    .filter(task =>
                        task.provider === provider &&
                        this.getWeekKey(task.timestamp) === week
                    )
                    .reduce((sum, task) => sum + task.cost, 0);

                return cost.toFixed(4) + "$";
            });

            return [
                username,
                project,
                provider,
                ...weekCosts
            ].join("\t");
        });

        const result = [
            header,
            ...rows
        ].join("\n");

        console.log(result);

        try {
            await navigator.clipboard.writeText(result);
            console.log("Usage copied to clipboard");
            alert("Usage copied to clipboard");
        } catch (error) {
            console.error("Failed to copy usage:", error);
        }

        return result;
    }

    async getUsageJson(
        username: string = "username",
        project: string = "proj_name",
        secret: string = "",
    ) {
        const tasks = this.usage.tasks.filter(
            task => typeof task.timestamp === "number" && task.timestamp > 0
        );

        if (tasks.length === 0) {
            const result = {
                username,
                project,
                spendings: 0,
                secret
            };

            console.log("Usage JSON", result);
            return result;
        }

        const spendings: Record<string, Record<string, number>> = {};

        for (const task of tasks) {
            const week = this.getWeekKey(task.timestamp);

            if (!spendings[week]) {
                spendings[week] = {};
            }

            if (!spendings[week][task.provider]) {
                spendings[week][task.provider] = 0;
            }

            spendings[week][task.provider] += task.cost;
        }

        const result = {
            username,
            project,
            spendings,
            secret
        };

        console.log("Usage JSON", result);

        return result;
    }

    private getWeekKey(timestamp: number): string {
        const date = new Date(timestamp);

        const day = date.getDay() || 7;
        date.setDate(date.getDate() - day + 1);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd}`;
    }
}