import { Users } from "../../database";

type ExecutionStatus = "done" | "failed" | "new";
type RecordStatus = "missing" | "invalid" | "synced" | "broken";
type ExecutionRecord<T> = { user: T; status: ExecutionStatus; message: string };

type RecordSummary<T> = Record<string, ExecutionRecord<T>>;

type UpdateResult<T> = {
  id: string | undefined;
  status: "done" | "failed" | "skipped";
  target: T;
  message?: string;
};

type UsersSummary = Record<RecordStatus, RecordSummary<Users>>;
type ExecutionStats = {
  done: number;
  failed: number;
  skipped: number;
};
type UserStats = {
  count: number;
  failed: number;
  skipped: number;
  done: number;
};
interface ExecutionSummary {
  users: UserStats;
}

export {
  ExecutionStats,
  ExecutionSummary,
  ExecutionRecord,
  UpdateResult,
  UsersSummary,
  RecordSummary,
  RecordStatus,
  UserStats,
};
