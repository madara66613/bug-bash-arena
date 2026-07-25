import { describe, expect, it } from "vitest";
import {
  buildRunReport,
  calculateAccuracy,
  calculateFindingScore,
  calculateGrade,
  calculateMissionBonus,
  formatClock,
  getAchievements,
} from "./game";
import type { Finding, MissionResult } from "./types";

const findings: Finding[] = [
  {
    missionId: "checkout",
    bugId: "CHK-101",
    selectedSeverity: "P1",
    correctSeverity: true,
    points: 240,
  },
  {
    missionId: "checkout",
    bugId: "CHK-102",
    selectedSeverity: "P1",
    correctSeverity: false,
    points: 135,
  },
];

const missionResults: MissionResult[] = [
  {
    missionId: "checkout",
    timeRemaining: 30,
    correctSeverityCount: 3,
    wrongClicks: 0,
    bonus: {
      speed: 120,
      precision: 200,
      cleanRun: 120,
      total: 440,
    },
  },
];

describe("game scoring", () => {
  it("rewards correct severity and combo play", () => {
    expect(calculateFindingScore("P0", true, 3)).toBe(355);
    expect(calculateFindingScore("P0", false, 3)).toBe(135);
  });

  it("calculates severity accuracy and run grades", () => {
    expect(calculateAccuracy(findings)).toBe(50);
    expect(calculateGrade(9, 8, 2)).toBe("S");
    expect(calculateGrade(7, 6, 9)).toBe("A");
    expect(calculateGrade(1, 1, 0)).toBe("D");
  });

  it("awards mission bonuses for speed, precision, and clean play", () => {
    expect(
      calculateMissionBonus({
        mode: "timed",
        timeRemaining: 30,
        correctSeverityCount: 3,
        totalBugs: 3,
        wrongClicks: 0,
      }),
    ).toEqual({
      speed: 120,
      precision: 200,
      cleanRun: 120,
      total: 440,
    });

    expect(
      calculateMissionBonus({
        mode: "practice",
        timeRemaining: 30,
        correctSeverityCount: 2,
        totalBugs: 3,
        wrongClicks: 1,
      }).total,
    ).toBe(0);
  });

  it("unlocks achievements from run performance", () => {
    const perfectFindings = Array.from({ length: 9 }, (_, index) => ({
      missionId: "checkout" as const,
      bugId: `BUG-${index}`,
      selectedSeverity: "P0" as const,
      correctSeverity: true,
      points: 280,
    }));
    const completeMissionResults = ["checkout", "auth", "support"].map(
      (missionId) => ({
        ...missionResults[0],
        missionId: missionId as MissionResult["missionId"],
      }),
    );
    const achievements = getAchievements({
      findings: perfectFindings,
      wrongClicks: 0,
      hintsUsed: 0,
      maxCombo: 3,
      mode: "timed",
      missionResults: completeMissionResults,
    });

    expect(achievements.map((achievement) => achievement.id)).toEqual([
      "perfect-triage",
      "clean-sweep",
      "hot-streak",
      "no-assist",
      "ahead-of-schedule",
    ]);
  });

  it("formats the mission clock safely", () => {
    expect(formatClock(72)).toBe("1:12");
    expect(formatClock(-5)).toBe("0:00");
  });

  it("builds a recruiter-readable QA run report", () => {
    const report = buildRunReport({
      findings,
      score: 375,
      wrongClicks: 1,
      mode: "timed",
      hintsUsed: 1,
      maxCombo: 2,
      missionResults,
    });

    expect(report).toContain("# Bug Bash Arena Run Report");
    expect(report).toContain("CHK-101");
    expect(report).toContain("Applied coupon does not reduce the order");
    expect(report).toContain("Severity accuracy: 50%");
    expect(report).toContain("Scanner uses: 1");
    expect(report).toContain("## Mission Bonuses");
  });
});
