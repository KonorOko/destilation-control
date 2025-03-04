export function StatusLed({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <div className="ml-4 size-3 rounded-full border bg-green-400/50 shadow-lg"></div>
    );
  } else {
    return (
      <div className="ml-4 size-3 rounded-full border bg-slate-400/50 shadow-lg"></div>
    );
  }
}
