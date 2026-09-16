"use client";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex flex-col w-full min-h-screen relative overflow-x-hidden">
      {children}
    </main>
  );
}

