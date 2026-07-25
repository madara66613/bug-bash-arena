export type Severity = "P0" | "P1" | "P2" | "P3";
export type GameMode = "timed" | "practice";
export type GamePhase =
  | "briefing"
  | "playing"
  | "mission-complete"
  | "results";

export interface Hotspot {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface BugCase {
  id: string;
  title: string;
  shortLabel: string;
  severity: Severity;
  actual: string;
  expected: string;
  evidence: string;
  hotspot: Hotspot;
}

export interface Mission {
  id: "checkout" | "auth" | "support";
  number: number;
  product: string;
  title: string;
  objective: string;
  route: string;
  timeLimit: number;
  bugs: BugCase[];
}

export interface Finding {
  missionId: Mission["id"];
  bugId: string;
  selectedSeverity: Severity;
  correctSeverity: boolean;
  points: number;
}
