import {
  ArrowRight,
  Bug,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crosshair,
  Download,
  Flame,
  Gauge,
  Headphones,
  LockKeyhole,
  Medal,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShoppingCart,
  Target,
  TicketCheck,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildRunReport,
  calculateAccuracy,
  calculateFindingScore,
  calculateGrade,
  formatClock,
  getBugById,
} from "./game";
import { MISSIONS, TOTAL_BUGS } from "./missions";
import type {
  Finding,
  GameMode,
  GamePhase,
  Mission,
  Severity,
} from "./types";
import "./App.css";

const SEVERITIES: Severity[] = ["P0", "P1", "P2", "P3"];
const BEST_SCORE_KEY = "bug-bash-arena:best-score";

function App() {
  const [mode, setMode] = useState<GameMode>("timed");
  const [phase, setPhase] = useState<GamePhase>("briefing");
  const [missionIndex, setMissionIndex] = useState(0);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [pendingBugId, setPendingBugId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MISSIONS[0].timeLimit);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState("Release window is waiting.");
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    return Number(window.localStorage.getItem(BEST_SCORE_KEY) ?? 0);
  });

  const mission = MISSIONS[missionIndex];
  const missionFindings = findings.filter(
    (finding) => finding.missionId === mission.id,
  );
  const foundBugIds = useMemo(
    () => new Set(missionFindings.map((finding) => finding.bugId)),
    [missionFindings],
  );
  const pendingBug = pendingBugId
    ? getBugById(mission, pendingBugId)
    : undefined;
  const correctSeverityCount = findings.filter(
    (finding) => finding.correctSeverity,
  ).length;
  const grade = calculateGrade(
    findings.length,
    correctSeverityCount,
    wrongClicks,
  );
  const isLastMission = missionIndex === MISSIONS.length - 1;

  useEffect(() => {
    if (
      phase !== "playing" ||
      mode !== "timed" ||
      pendingBugId !== null
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((currentTime) => Math.max(0, currentTime - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, pendingBugId, phase]);

  useEffect(() => {
    if (phase === "playing" && mode === "timed" && timeLeft === 0) {
      setFeedback("Time expired. The release window closed.");
      setPhase("results");
    }
  }, [mode, phase, timeLeft]);

  useEffect(() => {
    if (phase === "results" && score > bestScore) {
      setBestScore(score);
      window.localStorage.setItem(BEST_SCORE_KEY, String(score));
    }
  }, [bestScore, phase, score]);

  function startRun() {
    setMissionIndex(0);
    setFindings([]);
    setPendingBugId(null);
    setScore(0);
    setCombo(0);
    setWrongClicks(0);
    setTimeLeft(MISSIONS[0].timeLimit);
    setFeedback("Incident active. Scan the product surface.");
    setPhase("playing");
    playTone(soundEnabled, 520);
  }

  function restartRun() {
    setPhase("briefing");
    setMissionIndex(0);
    setFindings([]);
    setPendingBugId(null);
    setScore(0);
    setCombo(0);
    setWrongClicks(0);
    setTimeLeft(MISSIONS[0].timeLimit);
    setFeedback("Release window is waiting.");
  }

  function inspectBug(event: MouseEvent, bugId: string) {
    event.stopPropagation();

    if (
      phase !== "playing" ||
      pendingBugId !== null ||
      foundBugIds.has(bugId)
    ) {
      return;
    }

    setPendingBugId(bugId);
    setFeedback("Defect isolated. Assign release severity.");
    playTone(soundEnabled, 760);
  }

  function recordMiss() {
    if (phase !== "playing" || pendingBugId !== null) {
      return;
    }

    setWrongClicks((current) => current + 1);
    setCombo(0);
    setFeedback(
      mode === "timed"
        ? "False positive. Four seconds removed."
        : "False positive logged. Keep investigating.",
    );

    if (mode === "timed") {
      setTimeLeft((currentTime) => Math.max(0, currentTime - 4));
    }

    playTone(soundEnabled, 180);
  }

  function submitSeverity(selectedSeverity: Severity) {
    if (!pendingBug) {
      return;
    }

    const correctSeverity = selectedSeverity === pendingBug.severity;
    const points = calculateFindingScore(
      pendingBug.severity,
      correctSeverity,
      combo,
    );
    const finding: Finding = {
      missionId: mission.id,
      bugId: pendingBug.id,
      selectedSeverity,
      correctSeverity,
      points,
    };
    const nextFindings = [...findings, finding];
    const solvedMission = mission.bugs.every((bug) =>
      nextFindings.some(
        (candidate) =>
          candidate.missionId === mission.id && candidate.bugId === bug.id,
      ),
    );

    setFindings(nextFindings);
    setScore((currentScore) => currentScore + points);
    setCombo(correctSeverity ? combo + 1 : 0);
    setPendingBugId(null);
    setFeedback(
      correctSeverity
        ? `Severity confirmed. +${points} points.`
        : `Finding saved. Expected severity was ${pendingBug.severity}.`,
    );
    playTone(soundEnabled, correctSeverity ? 920 : 280);

    if (solvedMission) {
      setPhase("mission-complete");
    }
  }

  function advanceMission() {
    if (isLastMission) {
      setPhase("results");
      setFeedback("Bug bash complete. Report ready for review.");
      return;
    }

    const nextIndex = missionIndex + 1;
    setMissionIndex(nextIndex);
    setTimeLeft(MISSIONS[nextIndex].timeLimit);
    setPendingBugId(null);
    setCombo(0);
    setFeedback("New incident loaded. Begin investigation.");
    setPhase("playing");
  }

  function downloadReport() {
    const report = buildRunReport({
      findings,
      score,
      wrongClicks,
      mode,
    });
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bug-bash-arena-report.md";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="game-shell">
      <header className="command-bar">
        <div className="brand">
          <span className="brand-mark">
            <Bug size={21} />
          </span>
          <div>
            <strong>Bug Bash Arena</strong>
            <span>Release Incident #BB-09</span>
          </div>
        </div>

        <div className="mission-track" aria-label="Mission progress">
          {MISSIONS.map((item, index) => {
            const isComplete = findings.filter(
              (finding) => finding.missionId === item.id,
            ).length === item.bugs.length;

            return (
              <div
                key={item.id}
                className={`mission-node ${
                  index === missionIndex ? "is-current" : ""
                } ${isComplete ? "is-complete" : ""}`}
              >
                <span>{isComplete ? <CheckCircle2 size={15} /> : item.number}</span>
                <small>{item.product}</small>
              </div>
            );
          })}
        </div>

        <div className="run-metrics">
          <Metric
            icon={<Trophy size={16} />}
            label="Score"
            value={score.toLocaleString()}
          />
          <Metric
            icon={<Flame size={16} />}
            label="Combo"
            value={`x${combo}`}
            accent={combo >= 2}
          />
          <Metric
            icon={<Clock3 size={16} />}
            label={mode === "timed" ? "Time" : "Mode"}
            value={mode === "timed" ? formatClock(timeLeft) : "Open"}
            danger={mode === "timed" && timeLeft <= 15}
          />
          <button
            type="button"
            className="icon-control"
            onClick={() => setSoundEnabled((current) => !current)}
            title={soundEnabled ? "Mute game sounds" : "Enable game sounds"}
            aria-label={soundEnabled ? "Mute game sounds" : "Enable game sounds"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      <section className="game-grid">
        <section className="arena-column" aria-label="Bug hunting arena">
          <div className="mission-heading">
            <div>
              <span>Mission {mission.number} / {MISSIONS.length}</span>
              <h1>{mission.title}</h1>
            </div>
            <div className="mission-counter">
              <Target size={17} />
              <strong>{missionFindings.length} / {mission.bugs.length}</strong>
              <span>found</span>
            </div>
          </div>

          <div
            className={`arena-frame mode-${mode}`}
            onClick={recordMiss}
          >
            <div className="browser-bar">
              <div className="browser-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="browser-route">
                <LockKeyhole size={13} />
                <span>{mission.route}</span>
              </div>
              <span className="environment-badge">STAGING</span>
            </div>

            <div className="arena-canvas">
              <MissionScene mission={mission} />

              {mission.bugs.map((bug, index) => {
                const finding = missionFindings.find(
                  (candidate) => candidate.bugId === bug.id,
                );

                return (
                  <button
                    key={bug.id}
                    type="button"
                    className={`bug-hotspot ${finding ? "is-found" : ""}`}
                    style={{
                      left: `${bug.hotspot.left}%`,
                      top: `${bug.hotspot.top}%`,
                      width: `${bug.hotspot.width}%`,
                      height: `${bug.hotspot.height}%`,
                    }}
                    onClick={(event) => inspectBug(event, bug.id)}
                    disabled={Boolean(finding)}
                    aria-label={`Inspect suspicious area ${index + 1}`}
                  >
                    {finding ? (
                      <span className="finding-pin">
                        <CheckCircle2 size={14} />
                        {bug.id}
                      </span>
                    ) : (
                      <Crosshair size={18} />
                    )}
                  </button>
                );
              })}

              {phase === "briefing" && (
                <div className="arena-overlay briefing-overlay">
                  <div className="overlay-kicker">
                    <ShieldAlert size={18} />
                    Incoming incident
                  </div>
                  <h2>{mission.product} release candidate</h2>
                  <p>{mission.objective}</p>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      startRun();
                    }}
                  >
                    <Play size={17} fill="currentColor" />
                    Start bug bash
                  </button>
                </div>
              )}

              {phase === "mission-complete" && (
                <div className="arena-overlay complete-overlay">
                  <Medal size={36} />
                  <span>Mission cleared</span>
                  <h2>{mission.product} secured</h2>
                  <p>
                    {missionFindings.filter((finding) => finding.correctSeverity).length}
                    /{mission.bugs.length} severities triaged correctly.
                  </p>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      advanceMission();
                    }}
                  >
                    {isLastMission ? "View final report" : "Load next mission"}
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}

              {phase === "results" && (
                <div className="arena-overlay results-overlay">
                  <div className="grade-mark">{grade}</div>
                  <span>Incident report complete</span>
                  <h2>{score.toLocaleString()} points</h2>
                  <p>
                    {findings.length}/{TOTAL_BUGS} defects found with{" "}
                    {calculateAccuracy(findings)}% severity accuracy.
                  </p>
                  <div className="result-actions">
                    <button
                      type="button"
                      className="primary-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        downloadReport();
                      }}
                    >
                      <Download size={17} />
                      Export report
                    </button>
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        restartRun();
                      }}
                    >
                      <RotateCcw size={17} />
                      New run
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="arena-footer" aria-live="polite">
            <span className="status-light" />
            <strong>{feedback}</strong>
            <span>
              {mode === "timed"
                ? `False positives: ${wrongClicks} (-${wrongClicks * 4}s)`
                : `False positives: ${wrongClicks}`}
            </span>
          </div>
        </section>

        <aside className="ops-panel" aria-label="QA operations panel">
          <section className="ops-header">
            <div>
              <span>QA operations</span>
              <strong>{mission.product}</strong>
            </div>
            <div className="mode-control" aria-label="Game mode">
              <button
                type="button"
                className={mode === "timed" ? "is-active" : ""}
                onClick={() => setMode("timed")}
                disabled={phase !== "briefing"}
              >
                Timed
              </button>
              <button
                type="button"
                className={mode === "practice" ? "is-active" : ""}
                onClick={() => setMode("practice")}
                disabled={phase !== "briefing"}
              >
                Practice
              </button>
            </div>
          </section>

          {pendingBug ? (
            <section className="triage-panel" aria-live="polite">
              <div className="panel-kicker">
                <Crosshair size={16} />
                Defect isolated
              </div>
              <span className="bug-id">{pendingBug.id}</span>
              <h2>{pendingBug.title}</h2>
              <dl>
                <div>
                  <dt>Actual</dt>
                  <dd>{pendingBug.actual}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{pendingBug.evidence}</dd>
                </div>
              </dl>
              <div className="severity-block">
                <span>Assign release severity</span>
                <div className="severity-grid">
                  {SEVERITIES.map((severity) => (
                    <button
                      key={severity}
                      type="button"
                      className={`severity severity-${severity}`}
                      onClick={() => submitSeverity(severity)}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="brief-panel">
                <div className="panel-kicker">
                  <Gauge size={16} />
                  Mission brief
                </div>
                <h2>{mission.title}</h2>
                <p>{mission.objective}</p>
                <div className="brief-facts">
                  <span>
                    <Target size={15} />
                    {mission.bugs.length} defects
                  </span>
                  <span>
                    <Clock3 size={15} />
                    {mode === "timed"
                      ? `${mission.timeLimit}s window`
                      : "No time limit"}
                  </span>
                </div>
              </section>

              <section className="findings-panel">
                <div className="panel-title-row">
                  <span>Mission findings</span>
                  <strong>{missionFindings.length}/{mission.bugs.length}</strong>
                </div>
                <div className="finding-list">
                  {mission.bugs.map((bug) => {
                    const finding = missionFindings.find(
                      (candidate) => candidate.bugId === bug.id,
                    );

                    return (
                      <div
                        key={bug.id}
                        className={`finding-row ${finding ? "is-recorded" : ""}`}
                      >
                        <span className="finding-state">
                          {finding ? (
                            finding.correctSeverity ? (
                              <CheckCircle2 size={17} />
                            ) : (
                              <XCircle size={17} />
                            )
                          ) : (
                            <Search size={16} />
                          )}
                        </span>
                        <div>
                          <strong>
                            {finding ? bug.shortLabel : "Undiscovered defect"}
                          </strong>
                          <span>
                            {finding
                              ? `${bug.id} · ${finding.selectedSeverity}`
                              : "Evidence pending"}
                          </span>
                        </div>
                        {finding && <b>+{finding.points}</b>}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          <section className="run-summary">
            <div>
              <span>Run coverage</span>
              <strong>{findings.length}/{TOTAL_BUGS}</strong>
            </div>
            <div>
              <span>Severity accuracy</span>
              <strong>{calculateAccuracy(findings)}%</strong>
            </div>
            <div>
              <span>Best score</span>
              <strong>{bestScore.toLocaleString()}</strong>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  accent = false,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`metric ${accent ? "is-accent" : ""} ${
        danger ? "is-danger" : ""
      }`}
    >
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MissionScene({ mission }: { mission: Mission }) {
  if (mission.id === "checkout") {
    return <CheckoutScene />;
  }

  if (mission.id === "auth") {
    return <AuthScene />;
  }

  return <SupportScene />;
}

function CheckoutScene() {
  return (
    <div className="mock-app checkout-scene">
      <header className="mock-header">
        <div className="mock-brand">
          <ShoppingCart size={17} />
          <strong>MarketOS</strong>
        </div>
        <span>Secure checkout</span>
      </header>
      <div className="checkout-grid">
        <section className="order-summary">
          <span className="mock-eyebrow">Your order</span>
          <div className="product-line">
            <div className="product-thumb">NX</div>
            <div>
              <strong>Nomad headphones</strong>
              <span>Graphite · Qty 1</span>
            </div>
            <b>$88.00</b>
          </div>
          <div className="coupon-row">
            <span>SAVE20</span>
            <strong>Applied</strong>
          </div>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>$88.00</dd></div>
            <div><dt>Shipping</dt><dd>$5.00</dd></div>
            <div className="discount"><dt>Discount</dt><dd>$0.00</dd></div>
            <div className="total-line"><dt>Total</dt><dd>$138.99</dd></div>
          </dl>
        </section>
        <section className="payment-form">
          <span className="mock-eyebrow">Payment details</span>
          <label>
            Name on card
            <span className="mock-input">Alex Morgan</span>
          </label>
          <label>
            Card number
            <span className="mock-input sensitive">
              <CreditCard size={15} />
              4242 4242 4242 4242
            </span>
          </label>
          <div className="field-pair">
            <label>Expiry<span className="mock-input">08 / 29</span></label>
            <label>CVV<span className="mock-input">•••</span></label>
          </div>
          <button type="button" tabIndex={-1}>Pay $138.99</button>
        </section>
      </div>
    </div>
  );
}

function AuthScene() {
  return (
    <div className="mock-app auth-scene">
      <div className="auth-aside">
        <div className="northstar-mark"><LockKeyhole size={20} /></div>
        <strong>Northstar ID</strong>
        <p>One secure identity for every workspace.</p>
        <div className="trust-row">
          <ShieldAlert size={16} />
          SOC 2 monitored
        </div>
      </div>
      <section className="auth-form">
        <span className="mock-eyebrow">Welcome back</span>
        <h2>Sign in to your workspace</h2>
        <label>Email<span className="mock-input">denis@example.com</span></label>
        <label>Password<span className="mock-input exposed">supersecret123</span></label>
        <div className="stack-error">
          TypeError: auth.session is undefined<br />
          at /srv/auth/session.ts:184:12
        </div>
        <button type="button" tabIndex={-1}>Create account</button>
        <span className="auth-help">Forgot password? Contact workspace admin</span>
      </section>
    </div>
  );
}

function SupportScene() {
  return (
    <div className="mock-app support-scene">
      <aside className="ticket-sidebar">
        <div className="relay-brand">
          <Headphones size={17} />
          <strong>Relay Desk</strong>
        </div>
        <span className="mock-eyebrow">Customer</span>
        <div className="customer-head">
          <span>AM</span>
          <div>
            <strong>Alex Morgan</strong>
            <small>Enterprise</small>
          </div>
        </div>
        <dl className="customer-data">
          <div><dt>Email</dt><dd>alex@example.com</dd></div>
          <div className="pii-row"><dt>National ID</dt><dd>921104-3871</dd></div>
          <div><dt>Region</dt><dd>EU Central</dd></div>
        </dl>
      </aside>
      <section className="ticket-main">
        <header className="ticket-head">
          <div>
            <span>Ticket #4821</span>
            <strong>Refund charged twice</strong>
          </div>
          <div className="sla-badge">
            <TicketCheck size={15} />
            <span>On track</span>
            <small>Overdue 2h 14m</small>
          </div>
        </header>
        <div className="conversation">
          <div className="message customer-message">
            <span>Alex Morgan · 09:42</span>
            <p>I received two charges for the same order. Please refund the duplicate.</p>
          </div>
          <div className="message agent-message">
            <span>You · Draft</span>
            <p>Thanks Alex. I found the duplicate and started the refund.</p>
          </div>
        </div>
        <div className="reply-box">
          <div className="recipient-row">
            <UserRound size={15} />
            To: <strong>maria@example.com</strong>
          </div>
          <span>Your refund is now being processed.</span>
          <button type="button" tabIndex={-1}><Send size={14} /> Send reply</button>
        </div>
      </section>
    </div>
  );
}

function playTone(enabled: boolean, frequency: number) {
  if (!enabled || typeof window === "undefined" || !window.AudioContext) {
    return;
  }

  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
  window.setTimeout(() => void context.close(), 180);
}

export default App;
