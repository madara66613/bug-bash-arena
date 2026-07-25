import { MISSIONS, TOTAL_BUGS } from "./missions";
import type {
  Achievement,
  Finding,
  GameMode,
  Mission,
  MissionBonus,
  MissionResult,
  Severity,
} from "./types";

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

export function calculateMissionBonus(input: {
  mode: GameMode;
  timeRemaining: number;
  correctSeverityCount: number;
  totalBugs: number;
  wrongClicks: number;
}): MissionBonus {
  const speed =
    input.mode === "timed" ? Math.max(0, input.timeRemaining) * 4 : 0;
  const precision =
    input.correctSeverityCount === input.totalBugs ? 200 : 0;
  const cleanRun = input.wrongClicks === 0 ? 120 : 0;

  return {
    speed,
    precision,
    cleanRun,
    total: speed + precision + cleanRun,
  };
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

export function getAchievements(input: {
  findings: Finding[];
  wrongClicks: number;
  hintsUsed: number;
  maxCombo: number;
  mode: GameMode;
  missionResults: MissionResult[];
}): Achievement[] {
  const completeRun = input.findings.length === TOTAL_BUGS;
  const perfectTriage =
    completeRun && input.findings.every((finding) => finding.correctSeverity);
  const achievements: Achievement[] = [];

  if (perfectTriage) {
    achievements.push({
      id: "perfect-triage",
      title: "Perfect triage",
      description: "Assigned the correct severity to every defect.",
    });
  }

  if (completeRun && input.wrongClicks === 0) {
    achievements.push({
      id: "clean-sweep",
      title: "Clean sweep",
      description: "Completed the incident without a false positive.",
    });
  }

  if (input.maxCombo >= 3) {
    achievements.push({
      id: "hot-streak",
      title: "Hot streak",
      description: "Triaged an entire mission without breaking the combo.",
    });
  }

  if (completeRun && input.hintsUsed === 0) {
    achievements.push({
      id: "no-assist",
      title: "No assist",
      description: "Found every defect without using the signal scanner.",
    });
  }

  if (
    input.mode === "timed" &&
    input.missionResults.length === MISSIONS.length &&
    input.missionResults.every((result) => result.timeRemaining >= 20)
  ) {
    achievements.push({
      id: "ahead-of-schedule",
      title: "Ahead of schedule",
      description: "Closed every incident with at least 20 seconds remaining.",
    });
  }

  return achievements;
}

export function buildRunReport(input: {
  findings: Finding[];
  score: number;
  wrongClicks: number;
  mode: GameMode;
  hintsUsed?: number;
  maxCombo?: number;
  missionResults?: MissionResult[];
}) {
  const hintsUsed = input.hintsUsed ?? 0;
  const maxCombo = input.maxCombo ?? 0;
  const missionResults = input.missionResults ?? [];
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
  const bonusRows = missionResults.map((result) => {
    const mission = MISSIONS.find(
      (candidate) => candidate.id === result.missionId,
    );

    return `| ${mission?.product ?? result.missionId} | ${result.bonus.speed} | ${result.bonus.precision} | ${result.bonus.cleanRun} | ${result.bonus.total} |`;
  });
  const achievements = getAchievements({
    findings: input.findings,
    wrongClicks: input.wrongClicks,
    hintsUsed,
    maxCombo,
    mode: input.mode,
    missionResults,
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
    `Scanner uses: ${hintsUsed}`,
    `Best combo: x${maxCombo}`,
    "",
    "## Achievements",
    "",
    ...(achievements.length > 0
      ? achievements.map(
          (achievement) =>
            `- **${achievement.title}:** ${achievement.description}`,
        )
      : ["- No achievements unlocked in this run."]),
    "",
    "## Findings",
    "",
    "| ID | Defect | Expected severity | Selected | Result |",
    "| --- | --- | --- | --- | --- |",
    ...(findingRows.length > 0
      ? findingRows
      : ["| - | No findings recorded | - | - | - |"]),
    "",
    "## Mission Bonuses",
    "",
    "| Mission | Speed | Precision | Clean run | Total |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...(bonusRows.length > 0
      ? bonusRows
      : ["| - | 0 | 0 | 0 | 0 |"]),
    "",
    "## Coverage",
    "",
    "- Checkout pricing and payment-data exposure",
    "- Authentication security and error handling",
    "- Customer support privacy, SLA, and recipient routing",
  ].join("\n");
}
