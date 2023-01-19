import { Users } from "../database";


type ExecutionStatus = 'done' | 'failed' | 'new';
type UserExecutionRecord = { user: Users, status: ExecutionStatus, message: string };
type UsersSummary = Required<Record<'missing' | 'invalid' | 'synced' | 'broken', Record<string, UserExecutionRecord>>>;
type UpdateResult<T> = { id: string | undefined, status: 'done' | 'failed' | 'skipped', target: T | undefined, message?: string };

interface ExecutionSummary {
    users: UsersSummary
}

export { ExecutionSummary, UsersSummary, UserExecutionRecord, UpdateResult };