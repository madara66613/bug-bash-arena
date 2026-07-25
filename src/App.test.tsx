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
  });

  it("switches to practice mode before the run starts", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Practice" }));

    expect(screen.getByText("No time limit")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});
