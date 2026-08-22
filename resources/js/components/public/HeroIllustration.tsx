export default function HeroIllustration() {
    return (
        <svg
            viewBox="0 0 400 400"
            className="h-full w-full"
            aria-hidden="true"
            role="img"
            aria-label="Truk tangki air mengisi tangki rumah"
        >
            <defs>
                <linearGradient
                    id="waterGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#0094D9" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#005E8A" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#003D6B" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient
                    id="truckGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#1a1a2e" />
                    <stop offset="100%" stopColor="#0f0f1a" />
                </linearGradient>
                <radialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0094D9" stopOpacity="0.6" />
                    <stop offset="70%" stopColor="#005E8A" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#003D6B" stopOpacity="0" />
                </radialGradient>
                <filter
                    id="waterBlur"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                >
                    <feGaussianBlur stdDeviation="2" />
                </filter>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g className="hero-illustration">
                <g className="background-elements">
                    <rect
                        x="0"
                        y="280"
                        width="400"
                        height="120"
                        fill="#0a0a12"
                    />
                    <ellipse
                        cx="200"
                        cy="340"
                        rx="300"
                        ry="30"
                        fill="#0d0d1a"
                    />
                    <g className="ground-texture" opacity="0.15">
                        <path
                            d="M0,320 Q100,300 200,320 T400,320 L400,400 L0,400 Z"
                            fill="#0094D9"
                        />
                    </g>
                </g>

                <g className="water-arc" filter="url(#waterBlur)">
                    <path
                        d="M120,180 Q200,80 280,160"
                        stroke="url(#waterGradient)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        className="water-flow"
                    />
                    <path
                        d="M115,185 Q195,85 275,165"
                        stroke="url(#waterGradient)"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.7"
                        className="water-flow-inner"
                    />
                    <path
                        d="M125,175 Q205,75 285,155"
                        stroke="#0094D9"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.5"
                        className="water-flow-highlight"
                    />
                </g>

                <g className="splash-particles">
                    <circle
                        cx="280"
                        cy="160"
                        r="12"
                        fill="url(#splashGlow)"
                        className="splash-main"
                    />
                    <circle
                        cx="285"
                        cy="155"
                        r="8"
                        fill="#0094D9"
                        className="splash-core"
                    />
                    <circle
                        cx="295"
                        cy="148"
                        r="5"
                        fill="#00D4FF"
                        className="splash-tip"
                    />
                    <circle
                        cx="272"
                        cy="145"
                        r="4"
                        fill="#0094D9"
                        opacity="0.8"
                        className="droplet-1"
                    />
                    <circle
                        cx="290"
                        cy="138"
                        r="3"
                        fill="#00D4FF"
                        opacity="0.9"
                        className="droplet-2"
                    />
                    <circle
                        cx="265"
                        cy="152"
                        r="3"
                        fill="#0094D9"
                        opacity="0.7"
                        className="droplet-3"
                    />
                    <circle
                        cx="298"
                        cy="162"
                        r="4"
                        fill="#0094D9"
                        opacity="0.6"
                        className="droplet-4"
                    />
                    <circle
                        cx="258"
                        cy="158"
                        r="2.5"
                        fill="#00D4FF"
                        opacity="0.8"
                        className="droplet-5"
                    />
                </g>

                <g className="tank-truck">
                    <rect
                        x="20"
                        y="200"
                        width="110"
                        height="50"
                        rx="4"
                        fill="url(#truckGradient)"
                    />
                    <rect
                        x="15"
                        y="165"
                        width="120"
                        height="35"
                        rx="3"
                        fill="#1a1a2e"
                    />
                    <ellipse
                        cx="75"
                        cy="260"
                        rx="18"
                        ry="12"
                        fill="#0f0f1a"
                        stroke="#333"
                        strokeWidth="1"
                    />
                    <ellipse
                        cx="105"
                        cy="260"
                        rx="18"
                        ry="12"
                        fill="#0f0f1a"
                        stroke="#333"
                        strokeWidth="1"
                    />
                    <rect
                        x="35"
                        y="170"
                        width="25"
                        height="15"
                        rx="2"
                        fill="#0094D9"
                        opacity="0.3"
                    />
                    <path
                        d="M35,185 L45,175 L60,185"
                        stroke="#0094D9"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="4,3"
                    />
                </g>

                <g className="house-tank">
                    <g className="house">
                        <path
                            d="M300,320 L300,200 L350,160 L400,200 L400,320 Z"
                            fill="#1a1a2e"
                            stroke="#2a2a3e"
                            strokeWidth="1"
                        />
                        <path
                            d="M310,230 L310,300 L390,300 L390,230 Z"
                            fill="#0d0d1a"
                        />
                        <rect
                            x="325"
                            y="240"
                            width="15"
                            height="60"
                            rx="1"
                            fill="#2a2a3e"
                            opacity="0.5"
                        />
                        <rect
                            x="360"
                            y="240"
                            width="15"
                            height="60"
                            rx="1"
                            fill="#2a2a3e"
                            opacity="0.5"
                        />
                        <rect
                            x="315"
                            y="285"
                            width="70"
                            height="35"
                            rx="2"
                            fill="#2a2a3e"
                        />
                    </g>
                    <g className="tank" filter="url(#glow)">
                        <ellipse
                            cx="350"
                            cy="165"
                            rx="28"
                            ry="12"
                            fill="#005E8A"
                            opacity="0.3"
                            stroke="#0094D9"
                            strokeWidth="1.5"
                        />
                        <ellipse
                            cx="350"
                            cy="170"
                            rx="26"
                            ry="20"
                            fill="#0a1a2a"
                            stroke="#0094D9"
                            strokeWidth="1"
                        />
                        <ellipse
                            cx="350"
                            cy="170"
                            rx="24"
                            ry="18"
                            fill="url(#waterGradient)"
                            opacity="0.4"
                        />
                        <path
                            d="M324,170 Q350,150 376,170"
                            stroke="#0094D9"
                            strokeWidth="1.5"
                            fill="none"
                            opacity="0.6"
                            strokeDasharray="5,4"
                        />
                        <ellipse
                            cx="350"
                            cy="150"
                            rx="14"
                            ry="6"
                            fill="#0094D9"
                            opacity="0.2"
                        />
                    </g>
                    <path
                        d="M350,190 L350,200"
                        stroke="#0094D9"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.7"
                    />
                    <path
                        d="M340,200 L360,200"
                        stroke="#0094D9"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.5"
                    />
                </g>

                <g className="hose-connection">
                    <path
                        d="M130,180 Q160,180 175,175"
                        stroke="#2a2a3e"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <path
                        d="M130,180 Q160,180 175,175"
                        stroke="#1a1a2e"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <circle
                        cx="130"
                        cy="180"
                        r="8"
                        fill="#1a1a2e"
                        stroke="#333"
                        strokeWidth="1"
                    />
                    <circle
                        cx="175"
                        cy="175"
                        r="5"
                        fill="#0094D9"
                        opacity="0.5"
                    />
                </g>
            </g>

            <style>
                {`
                    .hero-illustration .water-flow {
                        animation: flowPulse 3s ease-in-out infinite;
                        transform-origin: center;
                    }
                    .hero-illustration .water-flow-inner {
                        animation: flowPulse 3s ease-in-out infinite 0.5s;
                    }
                    .hero-illustration .water-flow-highlight {
                        animation: flowPulse 3s ease-in-out infinite 0.25s;
                    }
                    .hero-illustration .splash-main {
                        animation: splashPulse 2s ease-in-out infinite;
                    }
                    .hero-illustration .splash-core {
                        animation: splashPulse 2s ease-in-out infinite 0.1s;
                    }
                    .hero-illustration .splash-tip {
                        animation: splashRise 2s ease-out infinite;
                    }
                    .hero-illustration .droplet-1,
                    .hero-illustration .droplet-2,
                    .hero-illustration .droplet-3,
                    .hero-illustration .droplet-4,
                    .hero-illustration .droplet-5 {
                        animation: dropletFall 1.5s ease-in infinite;
                    }
                    .hero-illustration .droplet-2 { animation-delay: 0.2s; }
                    .hero-illustration .droplet-3 { animation-delay: 0.4s; }
                    .hero-illustration .droplet-4 { animation-delay: 0.6s; }
                    .hero-illustration .droplet-5 { animation-delay: 0.8s; }
                    .hero-illustration .tank {
                        animation: tankFill 4s ease-in-out infinite;
                    }

                    @keyframes flowPulse {
                        0%, 100% { stroke-width: 6; opacity: 0.9; }
                        50% { stroke-width: 8; opacity: 1; }
                    }
                    @keyframes splashPulse {
                        0%, 100% { r: 12; opacity: 0.6; }
                        50% { r: 16; opacity: 0.4; }
                    }
                    @keyframes splashRise {
                        0% { transform: translate(0, 0); opacity: 1; }
                        100% { transform: translate(-15px, -25px); opacity: 0; }
                    }
                    @keyframes dropletFall {
                        0% { transform: translate(0, 0); opacity: 1; }
                        100% { transform: translate(var(--dx, 10px), 30px); opacity: 0; }
                    }
                    .hero-illustration .droplet-1 { --dx: -12px; }
                    .hero-illustration .droplet-2 { --dx: 8px; }
                    .hero-illustration .droplet-3 { --dx: -8px; }
                    .hero-illustration .droplet-4 { --dx: 15px; }
                    .hero-illustration .droplet-5 { --dx: -5px; }
                    @keyframes tankFill {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 0.6; }
                    }
                `}
            </style>
        </svg>
    );
}
