import { describe, expect, it } from "vitest";
import {
  buildRunReport,
  calculateAccuracy,
  calculateFindingScore,
  calculateGrade,
  formatClock,
} from "./game";
import type { Finding } from "./types";

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
    });

    expect(report).toContain("# Bug Bash Arena Run Report");
    expect(report).toContain("CHK-101");
    expect(report).toContain("Applied coupon does not reduce the order");
    expect(report).toContain("Severity accuracy: 50%");
  });
});
