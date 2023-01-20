import { ReportAgent } from "./report";


describe("Report progress by type", () => {
	test("Should execute clear reports without agent", () => {
		ReportAgent.clearReport();
	});
	test("Should display info progress", () => {
		ReportAgent.logProgress("Test", "Testing Progress", "info");
		ReportAgent.clearReport();
	});

	test("Should display warning progress", () => {
		ReportAgent.logProgress("Test", "Testing Progress", "warning");
		ReportAgent.clearReport();
	});

	test("Should display success progress", () => {
		ReportAgent.logProgress("Test", "Testing Progress", "success");
		ReportAgent.clearReport();
	});

	test("Should display complete progress", () => {
		ReportAgent.logProgress("Test", "Testing Progress", "complete");
		ReportAgent.clearReport();
	});


	test("Should display danger progress", () => {
		ReportAgent.logProgress("Test", "Testing Progress", "danger");
		ReportAgent.clearReport();
	});

	test("Should display info progress with data", () => {
        type TestData = { name: string, address: string, about: string };
        const testData: TestData = {
        	name: "Robert",
        	address: "Brussels",
        	about: "Developer"
        };
        ReportAgent.logProgress<TestData>("Test", "Testing Progress", "info", { data: [testData], reportFields: ["name", "address"] });
        const report = ReportAgent.getReport().find(report => report.includes("info"));
        expect(report).toBeDefined();
        ReportAgent.clearReport();
	});

	test("Should display failure progress", () => {
        type TestData = { name: string, address: string, about: string };
        const testData: TestData = {
        	name: "Robert",
        	address: "Brussels",
        	about: "Developer"
        };
        ReportAgent.logProgress<TestData>("Test", "Testing Progress", "failure", { data: [testData], reportFields: ["name", "address"] });
        const report = ReportAgent.getReport().find(report => report.includes("failure"));
        expect(report).toBeDefined();
        ReportAgent.clearReport();
	});

	test("Should display failure progress with data", () => {
        type TestData = { name: string, address: string, about: string };
        const testData: TestData = {
        	name: "Robert",
        	address: "Brussels",
        	about: "Developer"
        };
        ReportAgent.logProgress<TestData>("Test", "Testing Progress", "failure", { data: [testData, { ...testData, name: "Stephane" }], reportFields: ["name", "address"] });
        const report = ReportAgent.getReport().find(report => report.includes("Robert"));
        const report_2 = ReportAgent.getReport().find(report => report.includes("Stephane"));
        expect(report).toBeDefined();
        expect(report_2).toBeDefined();
        ReportAgent.clearReport();
	});


	test("Should display two logged progress with data", () => {
        type TestData = { name: string, address: string, about: string };
        const testData: TestData = {
        	name: "Robert",
        	address: "Brussels",
        	about: "Developer"
        };
        ReportAgent.logProgress("Test", "Testing Progress", "info");
        ReportAgent.logProgress<TestData>("Test", "Testing Progress", "failure", { data: [testData, { ...testData, name: "Stephane" }], reportFields: ["name", "address"] });
        const reportsSize = ReportAgent.getReport().length;
        expect(reportsSize).toEqual(2);
        ReportAgent.clearReport();
	});
});