import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Wallet } from "lucide-react";
import { EmptyState } from "./empty-state";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState icon={Wallet} title="No data" description="Nothing here" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<EmptyState icon={Wallet} title="No data" description="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders the icon as an svg", () => {
    const { container } = render(<EmptyState icon={Wallet} title="T" description="D" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders eyebrow when provided", () => {
    render(<EmptyState icon={Wallet} title="T" description="D" eyebrow="Getting Started" />);
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
  });

  it("does not render eyebrow when omitted", () => {
    const { container } = render(<EmptyState icon={Wallet} title="T" description="D" />);
    expect(container.querySelector("[data-testid='eyebrow']")).not.toBeInTheDocument();
  });

  it("renders primary action with href as a link", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="T"
        description="D"
        primaryAction={{ label: "Go there", href: "/app/vaults" }}
      />
    );
    const link = screen.getByRole("link", { name: /go there/i });
    expect(link).toHaveAttribute("href", "/app/vaults");
  });

  it("renders primary action with onClick as a button", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={Wallet}
        title="T"
        description="D"
        primaryAction={{ label: "Do it", onClick }}
      />
    );
    expect(screen.getByRole("button", { name: /do it/i })).toBeInTheDocument();
  });

  it("renders secondary action", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="T"
        description="D"
        secondaryAction={{ label: "Skip", href: "/app" }}
      />
    );
    expect(screen.getByRole("link", { name: /skip/i })).toBeInTheDocument();
  });

  it("does not render actions section when no actions provided", () => {
    const { container } = render(<EmptyState icon={Wallet} title="T" description="D" />);
    expect(container.querySelector("[data-testid='actions']")).not.toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <EmptyState icon={Wallet} title="T" description="D">
        <div>Extra content</div>
      </EmptyState>
    );
    expect(screen.getByText("Extra content")).toBeInTheDocument();
  });
});
