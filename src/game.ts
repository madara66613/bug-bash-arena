import { MISSIONS, TOTAL_BUGS } from "./missions";
import type { Finding, GameMode, Mission, Severity } from "./types";

const SEVERITY_POINTS: Record<Severity, number> = {
  P0: 180,
  P1: 140,
  P2: 110,
  P3: 90,
};

export function calculateFindingScore(
  severity: Severity,
  correctSeverity: boolean,
  combo: number,
) {
  const detectionPoints = 100;
  const triagePoints = correctSeverity ? SEVERITY_POINTS[severity] : 35;
  const comboBonus = correctSeverity ? Math.min(combo, 5) * 25 : 0;

  return detectionPoints + triagePoints + comboBonus;
}

export function calculateAccuracy(findings: Finding[]) {
  if (findings.length === 0) {
    return 0;
  }

  const correct = findings.filter((finding) => finding.correctSeverity).length;
  return Math.round((correct / findings.length) * 100);
}

export function calculateGrade(
  foundCount: number,
  correctSeverityCount: number,
  wrongClicks: number,
) {
  if (
    foundCount === TOTAL_BUGS &&
    correctSeverityCount >= TOTAL_BUGS - 1 &&
    wrongClicks <= 3
  ) {
    return "S";
  }

  if (foundCount >= 7 && correctSeverityCount >= 6) {
    return "A";
  }

  if (foundCount >= 5) {
    return "B";
  }

  if (foundCount >= 3) {
    return "C";
  }

  return "D";
}

export function getBugById(mission: Mission, bugId: string) {
  return mission.bugs.find((bug) => bug.id === bugId);
}

export function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function buildRunReport(input: {
  findings: Finding[];
  score: number;
  wrongClicks: number;
  mode: GameMode;
}) {
  const correctSeverityCount = input.findings.filter(
    (finding) => finding.correctSeverity,
  ).length;
  const grade = calculateGrade(
    input.findings.length,
    correctSeverityCount,
    input.wrongClicks,
  );
  const findingRows = input.findings.map((finding) => {
    const mission = MISSIONS.find(
      (candidate) => candidate.id === finding.missionId,
    );
    const bug = mission ? getBugById(mission, finding.bugId) : undefined;

    return `| ${finding.bugId} | ${bug?.title ?? "Unknown defect"} | ${bug?.severity ?? "-"} | ${finding.selectedSeverity} | ${finding.correctSeverity ? "PASS" : "REVIEW"} |`;
  });

  return [
    "# Bug Bash Arena Run Report",
    "",
    `Mode: ${input.mode === "timed" ? "Timed incident" : "Practice"}`,
    `Grade: ${grade}`,
    `Score: ${input.score}`,
    `Defects found: ${input.findings.length}/${TOTAL_BUGS}`,
    `Severity accuracy: ${calculateAccuracy(input.findings)}%`,
    `Misclicks: ${input.wrongClicks}`,
    "",
    "## Findings",
    "",
    "| ID | Defect | Expected severity | Selected | Result |",
    "| --- | --- | --- | --- | --- |",
    ...(findingRows.length > 0
      ? findingRows
      : ["| - | No findings recorded | - | - | - |"]),
    "",
    "## Coverage",
    "",
    "- Checkout pricing and payment-data exposure",
    "- Authentication security and error handling",
    "- Customer support privacy, SLA, and recipient routing",
  ].join("\n");
}
