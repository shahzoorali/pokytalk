interface AudioLevelBarProps {
  level: number // 0 to 1
}

export function AudioLevelBar({ level }: AudioLevelBarProps) {
  const width = Math.max(level * 100, 5) // Minimum 5% width for visibility

  return (
    <div className="audio-level-bar w-full h-2">
      <div
        className="audio-level-fill"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
