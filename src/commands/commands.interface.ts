import { LeasesView, Rooms, Users } from "../database";

type RecordStatus = "missing" | "invalid" | "synced" | "broken" | "error";

type UpdateResult<T> = {
  id: string | undefined;
  status: "done" | "failed" | "skipped";
  target: T;
  message?: string;
};

type CheckResult<T> = {
  item: T;
  status: RecordStatus;
  message?: string;
};

type UsersSummary = Record<RecordStatus, Array<CheckResult<Users>>>;
type RoomsSummary = Record<RecordStatus, Array<CheckResult<Rooms>>>;
type LeasesSummary = Record<RecordStatus, Array<CheckResult<LeasesView>>>;

type ExecutionStats = {
  done: number;
  failed: number;
  skipped: number;
};
type GenericStats = {
  count: number;
  failed: number;
  skipped: number;
  done: number;
  synced: number;
  error: number;
};
type UserStats = GenericStats;
type RoomsStats = GenericStats;
type LeasesStats = GenericStats;

interface ExecutionSummary {
  users?: UserStats;
  rooms?: RoomsStats;
  leases?: LeasesStats;
}

export {
  ExecutionStats,
  ExecutionSummary,
  UpdateResult,
  UsersSummary,
  RecordStatus,
  UserStats,
  RoomsSummary,
  RoomsStats,
  LeasesSummary,
  LeasesStats,
  CheckResult,
};
