import { ReportAgent } from "./report";

const report = {
  logProgress: ReportAgent.logProgress,
  clearReport: ReportAgent.clearReport,
  getReport: ReportAgent.getReport,
};
export { Choice, confirmCommit, selectCommands } from "./prompts";

export default report;
