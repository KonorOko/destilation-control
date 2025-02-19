export function DestilationPlate() {
  return (
    <div className="flex h-28 flex-col items-center justify-center">
      <div className="h-8 w-52 rounded border-2 border-slate-500 bg-slate-50" />
      <div className="relative h-12 w-40 overflow-hidden border-2 border-y-0 border-slate-600">
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern
            id="diagonalLines"
            patternUnits="userSpaceOnUse"
            width="15"
            height="10"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
          <rect
            width="100%"
            height="100%"
            fill="url(#diagonalLines)"
            className="text-slate-300 opacity-30"
          />
        </svg>
      </div>
      <div className="h-8 w-52 rounded border-2 border-slate-500 bg-slate-50 shadow-lg" />
    </div>
  );
}
