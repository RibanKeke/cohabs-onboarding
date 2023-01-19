
import { Signale, SignaleOptions } from 'signale';

type Payload<T> = { data: Array<T>, reportFields: Array<keyof T> };
type ReportType = 'start' | 'info' | 'warning' | 'danger' | 'success' | 'failure' | 'complete';

const signalOptions: SignaleOptions<ReportType> = {
    disabled: false,
    interactive: false,
    logLevel: 'info',
    scope: 'Cohabs',
    secrets: [],
    stream: process.stdout,
    types: {
        start: {
            badge: '⏩',
            color: 'green',
            label: 'START',
            logLevel: 'info'
        },
        info: {
            badge: '⏳',
            color: 'white',
            label: 'INFO',
            logLevel: 'info'
        },
        warning: {
            badge: '👋',
            color: 'cyanBright',
            label: 'WARNING',
            logLevel: 'warning'
        },
        danger: {
            badge: '🛑',
            color: 'red',
            label: 'DANGER',
            logLevel: 'error'
        },
        success: {
            badge: '👌',
            color: 'greenBright',
            label: 'SUCESS',
            logLevel: 'info'
        },
        failure: {
            badge: '🚫',
            color: 'redBright',
            label: 'Failure',
            logLevel: 'error'
        },
        complete: {
            badge: '✅',
            color: 'green',
            label: 'COMPLETE',
            logLevel: 'info'
        }
    }
};

class ReportAgent {
    private static instance: ReportAgent;
    private reports: Array<string>;
    private logger: Signale<ReportType>;
    constructor() {
        this.reports = [];
        this.logger = new Signale(signalOptions);
    }

    private printHeader(title: string, description: string, type: ReportType) {
        const message = `${title} - ${description} \n`;
        switch (type) {
            case 'start':
                this.logger.start(message);
            case 'failure':
                this.logger.failure(message)
                break;
                break;
            case 'danger':
                this.logger.danger(message)
                break;
                break;
            case 'warning':
                this.logger.warning(message)
                break;
            case 'complete':
                this.logger.complete(message)
                break;
            case 'success':
                this.logger.success(message)
                break;
            default:
                this.logger.info(message)
                break;
        }
    }

    private printData<T extends Record<string, any>>(data: Array<T>, reportFields: Array<keyof T>) {
        const printedData = data.map(dataItem => {
            const filteredData = reportFields.reduce((filtered, field) => {
                const value = dataItem[String(field)];
                return { ...filtered, [String(field)]: value }
            }, {

            } as Partial<T>)
            return filteredData;
        })
        console.table(printedData);
        return `Data: ${JSON.stringify(printedData, undefined, 2)}`
    }


    private reportProgress<T extends Record<string, any>>(title: string, description: string, type: ReportType, payload?: Payload<T>) {
        this.printHeader(title, description, type);
        let dataReport: string = '';
        if (payload) {
            dataReport = this.printData<T>(payload.data, payload.reportFields);
        }
        return `[${type}] - [${title}: ${description}] \n ${dataReport}`;

    }

    static logProgress<T extends Record<string, any>>(title: string, description: string, type: ReportType, payload?: Payload<T>) {
        if (!ReportAgent.instance) {
            this.instance = new ReportAgent();
        }
        const report = this.instance.reportProgress(title, description, type, payload);
        this.instance.reports = [...this.instance.reports, report]
    }

    static getReport(): Array<string> {
        if (this.instance) {
            return this.instance.reports;
        }
        return []
    }

    static clearReport() {
        if (this.instance) {
            this.instance.reports = [];
        }
    }

}

export { ReportAgent };