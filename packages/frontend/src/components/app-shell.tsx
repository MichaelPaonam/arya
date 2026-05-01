"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { FeatureGate } from "@/components/feature-gate";
import {
  LayoutDashboard,
  Sparkles,
  Bot,
  ShieldCheck,
  Wallet,
  History,
  Settings,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { FeatureName } from "@/lib/feature-flags";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  feature?: FeatureName;
}

const nav: NavItem[] = [
  { icon: LayoutDashboard, label: "Command", href: "/app" },
  { icon: Sparkles, label: "Opportunities", href: "/app/opportunities" },
  { icon: Bot, label: "Agents", href: "/app/agents" },
  { icon: ShieldCheck, label: "Risk", href: "/app/risk" },
  { icon: History, label: "History", href: "/app/history", feature: "historyPage" },
  { icon: Wallet, label: "Vaults", href: "/app/vaults", feature: "vaultsPage" },
  { icon: Settings, label: "Settings", href: "/app/settings", feature: "settingsPage" },
];

export function AppShell({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("arya-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("arya-sidebar-collapsed", String(next));
  };

  return (
    <div className="relative z-10 flex min-h-screen text-on-surface">
      <aside className={`glass sticky top-6 my-6 ml-6 hidden h-[calc(100vh-3rem)] flex-col transition-all duration-200 lg:flex ${collapsed ? "w-[72px] items-center px-3 py-5" : "w-64 p-5"}`}>
        <Link href="/" className="flex justify-center py-2 transition hover:opacity-80">
          {collapsed ? (
            <Image src="/arya-logo-no-bg.png" alt="ARYA" width={28} height={28} className="dark:invert" />
          ) : (
            <h1 className="text-4xl font-bold tracking-[0.25em] text-foreground">ARYA</h1>
          )}
        </Link>

        <nav className={`mt-8 flex flex-col gap-1 ${collapsed ? "w-full" : ""}`}>
          {nav.map(({ icon: Icon, label, href, feature }) => {
            const active = isActive(href);
            const link = (
              <Link
                key={label}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-lg text-sm font-semibold transition ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
                } ${
                  active
                    ? "bg-foreground/10 text-foreground"
                    : "text-on-surface-variant hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                {!collapsed && label}
              </Link>
            );

            if (feature) {
              return (
                <FeatureGate key={label} feature={feature}>
                  {link}
                </FeatureGate>
              );
            }
            return link;
          })}
        </nav>

        <div className={`mt-auto space-y-3 ${collapsed ? "w-full" : ""}`}>
          <button
            onClick={toggleCollapsed}
            className={`flex w-full items-center rounded-lg text-sm font-semibold text-on-surface-variant transition hover:bg-foreground/5 hover:text-foreground ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4 shrink-0" strokeWidth={1.75} /> : <PanelLeftClose className="size-4 shrink-0" strokeWidth={1.75} />}
            {!collapsed && "Collapse"}
          </button>
          {!collapsed && <ModeToggle />}
          <div className={`rounded-xl border border-border bg-[oklch(0.30_0.05_235/0.2)] ${collapsed ? "p-2.5" : "p-4"}`}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Wallet className="size-3.5 text-on-surface-variant" strokeWidth={1.75} />
                <span className="size-1.5 animate-pulse rounded-full bg-tertiary" />
              </div>
            ) : (
              <>
                <div className="label-eyebrow">Connected</div>
                <div className="text-mono mt-1.5 text-xs">0x84c2…f31a</div>
                <div className="mt-3 flex items-center gap-2 text-xs text-tertiary">
                  <span className="size-1.5 animate-pulse rounded-full bg-tertiary" />
                  Swarm online · 4 agents
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 px-5 py-6 sm:px-8 lg:py-8">
        <header className="glass sticky top-6 z-30 flex flex-wrap items-center gap-4 rounded-2xl px-5 py-3">
          <div>
            <div className="label-eyebrow">{eyebrow}</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="glass hidden h-11 items-center gap-2 rounded-xl px-4 md:flex">
              <Search className="size-4 text-on-surface-variant" />
              <input
                placeholder="Search protocols, assets, agents…"
                className="w-56 bg-transparent text-sm placeholder:text-on-surface-variant focus:outline-none"
              />
              <kbd className="text-mono rounded-md border border-border px-1.5 py-0.5 text-[10px] text-on-surface-variant">
                ⌘K
              </kbd>
            </div>
            {actions}
            <ThemeToggle />
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
