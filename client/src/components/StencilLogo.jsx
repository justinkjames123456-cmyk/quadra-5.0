export default function StencilLogo({ size = 'large', className = '' }) {
  const sizes = {
    small: { width: 120, height: 40, fontSize: 24 },
    medium: { width: 200, height: 60, fontSize: 40 },
    large: { width: 400, height: 100, fontSize: 72 },
    xlarge: { width: 600, height: 150, fontSize: 120 }
  }

  const { width, height, fontSize } = sizes[size] || sizes.large

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`inline-block ${className}`}
      style={{ width: '100%', maxWidth: `${width}px`, height: 'auto' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{`
          .stencil-text {
            font-family: 'Orbitron', 'Rajdhani', 'Share Tech Mono', monospace;
            font-weight: 900;
            fill: #FFFFFF;
          }
          .stencil-cut {
            fill: #000000;
          }
        `}</style>
      </defs>

      {/* QUADRA Text */}
      <g className="stencil-group">
        {/* Q - Square with diagonal break */}
        <g transform="translate(0, 10)">
          <rect x="0" y="0" width="50" height="50" fill="none" stroke="white" strokeWidth="4"/>
          <line x1="35" y1="35" x2="55" y2="55" stroke="white" strokeWidth="4"/>
          {/* Diagonal cut */}
          <polygon points="15,0 25,0 10,15 0,15" className="stencil-cut"/>
        </g>

        {/* U */}
        <g transform="translate(60, 10)">
          <rect x="0" y="0" width="8" height="40" fill="white"/>
          <rect x="32" y="0" width="8" height="40" fill="white"/>
          <rect x="8" y="32" width="24" height="8" fill="white"/>
          {/* Diagonal cuts */}
          <polygon points="0,0 10,0 0,10" className="stencil-cut"/>
          <polygon points="32,0 40,0 40,8" className="stencil-cut"/>
        </g>

        {/* A - Sharp pointed */}
        <g transform="translate(115, 10)">
          <polygon points="20,0 40,0 40,8 28,8 28,40 20,40 20,8 8,8" fill="white"/>
          <rect x="12" y="20" width="16" height="6" fill="white"/>
          {/* Diagonal cuts */}
          <polygon points="20,0 30,0 25,5" className="stencil-cut"/>
        </g>

        {/* D */}
        <g transform="translate(165, 10)">
          <rect x="0" y="0" width="8" height="40" fill="white"/>
          <rect x="8" y="0" width="24" height="8" fill="white"/>
          <rect x="8" y="32" width="24" height="8" fill="white"/>
          <rect x="24" y="8" width="8" height="24" fill="white"/>
          {/* Diagonal cuts */}
          <polygon points="0,0 10,0 0,10" className="stencil-cut"/>
          <polygon points="0,32 0,40 8,40" className="stencil-cut"/>
        </g>

        {/* R - Sharp pointed legs */}
        <g transform="translate(215, 10)">
          <rect x="0" y="0" width="8" height="40" fill="white"/>
          <rect x="8" y="0" width="24" height="8" fill="white"/>
          <rect x="8" y="16" width="24" height="8" fill="white"/>
          <rect x="24" y="8" width="8" height="8" fill="white"/>
          <rect x="20" y="24" width="8" height="16" fill="white"/>
          {/* Diagonal cuts */}
          <polygon points="0,0 10,0 0,10" className="stencil-cut"/>
          <polygon points="0,32 0,40 8,40" className="stencil-cut"/>
        </g>

        {/* A (second) */}
        <g transform="translate(270, 10)">
          <polygon points="20,0 40,0 40,8 28,8 28,40 20,40 20,8 8,8" fill="white"/>
          <rect x="12" y="20" width="16" height="6" fill="white"/>
          {/* Diagonal cuts */}
          <polygon points="20,0 30,0 25,5" className="stencil-cut"/>
        </g>
      </g>

      {/* 5.0 */}
      <g transform="translate(330, 15)">
        {/* 5 */}
        <g>
          <rect x="0" y="0" width="28" height="8" fill="white"/>
          <rect x="0" y="0" width="8" height="20" fill="white"/>
          <rect x="8" y="12" width="20" height="8" fill="white"/>
          <rect x="20" y="20" width="8" height="20" fill="white"/>
          <rect x="0" y="32" width="28" height="8" fill="white"/>
        </g>

        {/* . (square period) */}
        <rect x="36" y="32" width="8" height="8" fill="white"/>

        {/* 0 */}
        <g transform="translate(52, 0)">
          <rect x="0" y="0" width="8" height="40" fill="white"/>
          <rect x="20" y="0" width="8" height="40" fill="white"/>
          <rect x="8" y="0" width="12" height="8" fill="white"/>
          <rect x="8" y="32" width="12" height="8" fill="white"/>
        </g>
      </g>
    </svg>
  )
}