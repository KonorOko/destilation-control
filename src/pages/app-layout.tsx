import { Outlet } from "react-router";

export function AppLayout() {
  return (
    <main className="flex min-h-screen bg-background p-1">
      <Outlet />
    </main>
  );
}
