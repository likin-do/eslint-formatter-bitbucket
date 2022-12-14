import path from "path";
// import stylish from "eslint/lib/cli-engine/formatters/stylish";
import got, { Response } from "got";
import { CLIEngine } from "@typescript-eslint/utils/dist/ts-eslint";

const BITBUCKET_WORKSPACE = getEnv("BITBUCKET_WORKSPACE"); //"curalie";
const BITBUCKET_REPO_SLUG = getEnv("BITBUCKET_REPO_SLUG"); //"tnp-chameleon";
const BITBUCKET_COMMIT = getEnv("BITBUCKET_COMMIT"); //"919db18";
const BITBUCKET_API_AUTH = getEnv("BITBUCKET_API_AUTH");

const MAX_ANNOTATIONS_PER_REQUEST = 100;

const httpClient = got.extend({
  prefixUrl: `https://api.bitbucket.org/2.0`,
  responseType: "json" as const,
  headers: {
    Authorization: `Bearer ${BITBUCKET_API_AUTH}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

enum SEVERITIES {
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

type BBAnnotationItem = {
  external_id: string;
  line: number;
  path: string;
  summary: string;
  annotation_type: "BUG";
  severity: SEVERITIES;
};

type BBReportData = {
  title: string;
  reporter: string;
  report_type: string;
  details: string;
  result: "FAILED" | "PASSED";
};

function generateReport(results: CLIEngine.LintResult[]): BBReportData {
  const summary = results.reduce(
    (acc, current) => {
      acc.errorCount += current.errorCount;
      acc.warningCount += current.warningCount;
      return acc;
    },
    { errorCount: 0, warningCount: 0 }
  );

  const { errorCount, warningCount } = summary;
  const problemCount = errorCount + warningCount;

  const details = `${problemCount} problem${
    problemCount !== 1 ? "s" : ""
  } (${errorCount} error${
    errorCount !== 1 ? "s" : ""
  }, ${warningCount} warning${warningCount !== 1 ? "s" : ""})`;
  const result = errorCount > 0 ? "FAILED" : "PASSED";

  return {
    title: "ESLint Bitbucket reporter",
    reporter: "ESLint",
    report_type: "TEST",
    details,
    result,
  };
}

function generateAnnotations(
  results: CLIEngine.LintResult[],
  reportId: string
): BBAnnotationItem[] {
  const result = results.reduce((acc, result) => {
    const relativePath = path.relative(process.cwd(), result.filePath);

    return [
      ...acc,
      ...result.messages.map((messageObject, i) => {
        const { line, message, severity, ruleId } = messageObject;
        const external_id = `${reportId}-${relativePath}-${line}-${ruleId}-${i}`;

        const result: BBAnnotationItem = {
          external_id,
          line,
          path: relativePath,
          summary: `${message} (${ruleId})`,
          annotation_type: "BUG",
          severity: severity === 1 ? SEVERITIES.MEDIUM : SEVERITIES.HIGH,
        };

        return result;
      }),
    ];
  }, [] as BBAnnotationItem[]);

  return result;
}

async function deleteReport(reportId: string) {
  return httpClient.delete(
    `repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/commit/${BITBUCKET_COMMIT}/reports/${reportId}`
  );
}

async function createReport(reportId: string, reportData: BBReportData) {
  return httpClient.put(
    `repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/commit/${BITBUCKET_COMMIT}/reports/${reportId}`,
    {
      json: reportData,
      responseType: "json",
    }
  );
}

async function createAnnotations(
  reportId: string,
  annotations: BBAnnotationItem[]
): Promise<Response<unknown>> {
  const chunk = annotations.slice(0, MAX_ANNOTATIONS_PER_REQUEST);
  const response = await httpClient.post(
    `repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/commit/${BITBUCKET_COMMIT}/reports/${reportId}/annotations`,
    {
      json: chunk,
      responseType: "json",
    }
  );

  if (annotations.length > MAX_ANNOTATIONS_PER_REQUEST) {
    return createAnnotations(
      reportId,
      annotations.slice(MAX_ANNOTATIONS_PER_REQUEST)
    );
  }
  return response;
}

async function processResults(results: CLIEngine.LintResult[]) {
  const reportId = `eslint-${BITBUCKET_COMMIT}`;
  const report = generateReport(results);
  const annotations = generateAnnotations(results, reportId);

  try {
    await deleteReport(reportId);
    console.log("Previous report deleted");
  } catch (error: any) {
    console.log("❌ Report deletion failed");

    if (error.request) {
      console.log(error.request.options);
    }
    if (error.response) {
      console.error(error.message, error.response.body);
    } else {
      console.error(error);
    }
  }

  try {
    await createReport(reportId, report);
    console.log("New report created");
  } catch (error: any) {
    console.log("❌ Report creation failed");

    if (error.request) {
      console.log(error.request.options);
    }
    if (error.response) {
      console.error(error.message, error.response.body);
    } else {
      console.error(error);
    }
  }

  try {
    await createAnnotations(reportId, annotations);
    console.log("Annotations added");
  } catch (error: any) {
    console.log("❌ Annotations adding failed");

    if (error.request) {
      console.log(error.request.options);
    }
    if (error.response) {
      console.error(error.message, error.response.body);
    } else {
      console.error(error);
    }
  }
}

function getEnv(key: string) {
  const test = process.env[key];

  if (!test) {
    throw new Error(`Missing ENV var: [${key}]`);
  }

  return test;
}

module.exports = async function (results: CLIEngine.LintResult[]) {
  await processResults(results);
  // return stylish(results);
};
