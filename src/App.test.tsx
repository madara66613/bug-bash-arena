import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("Bug Bash Arena", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts a run and records a correctly triaged defect", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "MarketOS release candidate" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start bug bash" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Inspect suspicious area 1" }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Applied coupon does not reduce the order",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "P1" }));

    expect(screen.getByText("Discount ignored")).toBeInTheDocument();
    expect(screen.getByText("Severity confirmed. +240 points.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Review finding CHK-101" }),
    );

    expect(screen.getByText("Finding review")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The order total should include the 20% coupon reduction.",
      ),
    ).toBeInTheDocument();
  });

  it("switches to practice mode before the run starts", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Practice" }));

    expect(screen.getByText("No time limit")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("pauses and resumes an active incident", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start bug bash" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause run" }));

    expect(
      screen.getByRole("heading", { name: "Investigation on hold" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume incident" }));

    expect(
      screen.queryByRole("heading", { name: "Investigation on hold" }),
    ).not.toBeInTheDocument();
  });

  it("consumes a signal scanner charge and reports its time cost", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start bug bash" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Use signal scanner (2 remaining)",
      }),
    );

    expect(
      screen.getByText("Signal found. Scanner cost: six seconds."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Use signal scanner (1 remaining)",
      }),
    ).toBeInTheDocument();
  });
});
