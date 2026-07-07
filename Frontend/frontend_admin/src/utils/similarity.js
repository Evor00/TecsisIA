export function simColor(pct) {
  if (pct == null) return 'rgba(0,0,0,0.15)'
  if (pct >= 80) return '#ef4444'
  if (pct >= 60) return '#f59e0b'
  return '#22c55e'
}
