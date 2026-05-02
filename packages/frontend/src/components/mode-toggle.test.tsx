import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModeToggle } from "./mode-toggle";
import { AppModeProvider } from "@/hooks/use-app-mode";

function renderWithMode(ui: React.ReactElement) {
  return render(<AppModeProvider>{ui}</AppModeProvider>);
}

describe("ModeToggle", () => {
  it("renders the label", () => {
    renderWithMode(<ModeToggle />);
    expect(screen.getByText("Demo mode")).toBeInTheDocument();
  });

  it("switch is on (hackathon) by default", () => {
    renderWithMode(<ModeToggle />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("toggles to full mode on click", async () => {
    const user = userEvent.setup();
    renderWithMode(<ModeToggle />);
    const toggle = screen.getByRole("switch");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});
