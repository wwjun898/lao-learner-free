interface Props { size?: number; fill?: string; className?: string; strokeWidth?: number }
export function Volume2({ size = 18 }: Props) { return <span style={{ fontSize: size }}>🔊</span> }
export function Mic({ size = 18 }: Props) { return <span style={{ fontSize: size }}>🎤</span> }
export function Heart({ size = 18, fill }: Props) { return <span className={fill === 'currentColor' ? 'text-red-500' : 'text-gray-400'} style={{ fontSize: size }}>{fill === 'currentColor' ? '♥' : '♡'}</span> }
export function Star({ size = 18, fill }: Props) { return <span className={fill === 'currentColor' ? 'text-amber-500' : 'text-gray-400'} style={{ fontSize: size }}>{fill === 'currentColor' ? '★' : '☆'}</span> }
