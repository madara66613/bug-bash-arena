# Bug Bash Arena Test Plan

## Objective

Verify that a player can complete every mission, receive deterministic scoring,
and export an accurate run report on current desktop and mobile browsers.

## Priority Risks

| Risk | Impact | Coverage |
| --- | --- | --- |
| A hotspot cannot be selected | Blocks mission progress | UI test and manual mission run |
| Severity score is incorrect | Invalidates competition and report | Unit tests for scoring |
| Timer continues during triage | Creates unfair time loss | Manual timed-mode check |
| Findings leak between missions | Produces false completion | Full three-mission run |
| GitHub Pages asset paths break | Published game is unusable | Production build and deployed smoke test |

## Automated Coverage

- scoring for correct and incorrect severity;
- combo bonus cap;
- accuracy and grade thresholds;
- negative clock input handling;
- Markdown report content;
- run start, defect discovery, and severity submission;
- practice-mode selection.

## Manual Release Checklist

1. Start a timed run and verify the clock decreases.
2. Select a wrong area and verify the four-second penalty.
3. Open a defect and verify the clock pauses during triage.
4. Complete all three defects in each mission.
5. Confirm the next mission resets time and combo.
6. Complete all nine findings and verify grade, score, and accuracy.
7. Export the report and inspect all recorded IDs and severities.
8. Reload the page and confirm the best score persists.
9. Repeat the primary flow at 390 x 844 and 1440 x 900 viewports.
10. Confirm focus styles and keyboard activation for all game controls.

## Exit Criteria

- `npm run check` passes;
- no blocking layout overlap at target viewports;
- the production deployment loads without console or asset errors;
- all three missions can be completed without a dead end.
