import { Entities } from "../database";


type ExecutionStatus = "done" | "failed" | "new";
type ExecutionRecord<T> = { user: T, status: ExecutionStatus, message: string };
type RecordSummary<T> = Required<Record<"missing" | "invalid" | "synced" | "broken", Record<string, ExecutionRecord<T>>>>;
type UpdateResult<T> = { id: string | undefined, status: "done" | "failed" | "skipped", target: T | undefined, message?: string };

type UsersSummary = RecordSummary<Entities.Users>;
interface ExecutionSummary {
    users: UsersSummary,
}

export { ExecutionSummary, ExecutionRecord, UpdateResult, UsersSummary };