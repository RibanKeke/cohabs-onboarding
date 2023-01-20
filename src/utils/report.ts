import { Signale, type SignaleOptions } from "signale";

type Payload<T> = { data: T[]; reportFields: Array<keyof T> };
type ReportType =
  | "start"
  | "info"
  | "warning"
  | "danger"
  | "success"
  | "failure"
  | "complete";

const signalOptions: SignaleOptions<ReportType> = {
  disabled: false,
  interactive: false,
  logLevel: "info",
  scope: "Cohabs",
  secrets: [],
  stream: process.stdout,
  types: {
    start: {
      badge: "⏩",
      color: "green",
      label: "START",
      logLevel: "info",
    },
    info: {
      badge: "⏳",
      color: "white",
      label: "INFO",
      logLevel: "info",
    },
    warning: {
      badge: "👋",
      color: "cyanBright",
      label: "WARNING",
      logLevel: "warning",
    },
    danger: {
      badge: "🛑",
      color: "red",
      label: "DANGER",
      logLevel: "error",
    },
    success: {
      badge: "👌",
      color: "greenBright",
      label: "SUCCESS",
      logLevel: "info",
    },
    failure: {
      badge: "🚫",
      color: "redBright",
      label: "Failure",
      logLevel: "error",
    },
    complete: {
      badge: "✅",
      color: "green",
      label: "COMPLETE",
      logLevel: "info",
    },
  },
};

class ReportAgent {
  static logProgress<T>(
    title: string,
    description: string,
    type: ReportType,
    payload?: Payload<T>
  ) {
    if (!this.instance) {
      this.instance = new ReportAgent();
    }

    this.instance.reportProgress<T>(title, description, type, payload);
  }

  static getReport(): string[] {
    if (this.instance) {
      return this.instance.reports;
    }

    return [];
  }

  static clearReport() {
    if (this.instance) {
      this.instance.reports = [];
    }
  }

  private static instance: ReportAgent;
  private reports: string[] = [];
  private readonly logger: Signale<ReportType>;
  constructor() {
    this.reports = [];
    this.logger = new Signale(signalOptions);
  }

  private printHeader(title: string, description: string, type: ReportType) {
    const message = `${title} - ${description} \n`;
    switch (type) {
      case "start":
        this.logger.start(message);
        break;
      case "failure":
        this.logger.failure(message);
        break;
      case "danger":
        this.logger.danger(message);
        break;
      case "warning":
        this.logger.warning(message);
        break;
      case "complete":
        this.logger.complete(message);
        break;
      case "success":
        this.logger.success(message);
        break;
      default:
        this.logger.info(message);
        break;
    }
  }

  private printData<T>(data: T[], reportFields: Array<keyof T>) {
    const printedData = data.map((dataItem) => {
      const filteredData = reportFields.reduce<Partial<T>>(
        (filtered, field) => {
          const value: unknown = (dataItem as Record<string, any>)[
            String(field)
          ];
          return { ...filtered, [String(field)]: value };
        },
        {}
      );
      return filteredData;
    });
    console.table(printedData);
    return `Data: ${JSON.stringify(printedData, undefined, 2)}`;
  }

  private reportProgress<T>(
    title: string,
    description: string,
    type: ReportType,
    payload?: Payload<T>
  ) {
    this.printHeader(title, description, type);
    let dataReport = "";
    if (payload) {
      dataReport = this.printData<T>(payload.data, payload.reportFields);
    }

    this.reports.push(
      `[${type}] - [${title}: ${description}] \n ${dataReport}`
    );
  }
}

export { ReportAgent };
