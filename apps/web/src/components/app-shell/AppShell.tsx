import type { ReactNode } from "react";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex">
        <aside className="hidden w-72 p-4 md:block">
          <SideNav />
        </aside>

        <main className="flex-1">
          <div className="sticky top-0 z-30 border-b border-white/5 bg-bg/80 p-4 backdrop-blur">
            <TopBar />
          </div>
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
