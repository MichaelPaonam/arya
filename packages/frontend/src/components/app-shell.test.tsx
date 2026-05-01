import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";
import { AppModeProvider } from "@/hooks/use-app-mode";
import { ThemeProvider } from "./theme-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderShell(props?: Partial<React.ComponentProps<typeof AppShell>>) {
  return render(
    <ThemeProvider>
      <AppModeProvider>
        <AppShell eyebrow="Test" title="Page Title" {...props}>
          <div>Content</div>
        </AppShell>
      </AppModeProvider>
    </ThemeProvider>
  );
}

describe("AppShell", () => {
  it("renders the eyebrow and title", () => {
    renderShell();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("Page Title")).toBeInTheDocument();
  });

  it("renders children content", () => {
    renderShell();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders core navigation items", () => {
    renderShell();
    expect(screen.getByText("Command")).toBeInTheDocument();
    expect(screen.getByText("Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByText("Risk")).toBeInTheDocument();
  });

  it("renders ARYA brand in sidebar", () => {
    renderShell();
    expect(screen.getByText("ARYA")).toBeInTheDocument();
  });
});
