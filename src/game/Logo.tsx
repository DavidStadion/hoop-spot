import styles from './Logo.module.css';

type Props = { size?: 'large' | 'small' };

export function Logo({ size = 'small' }: Props) {
  const isLarge = size === 'large';
  return (
    <div className={`${styles.wrap} ${isLarge ? styles.large : styles.small}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 44 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Net lines (subtle) */}
        <line x1="5.5" y1="5.5" x2="5.5" y2="27" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="13" y1="5.5" x2="13" y2="27" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="22" y1="5.5" x2="22" y2="27" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="31" y1="5.5" x2="31" y2="27" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="38.5" y1="5.5" x2="38.5" y2="27" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="3.75" y1="11" x2="40.25" y2="11" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="3.75" y1="18" x2="40.25" y2="18" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="3.75" y1="25" x2="40.25" y2="25" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        {/* Crossbar */}
        <rect x="2" y="2" width="40" height="4" rx="2" fill="white" opacity="0.95"/>
        {/* Left post */}
        <rect x="2" y="2" width="4" height="27" rx="2" fill="white" opacity="0.95"/>
        {/* Right post */}
        <rect x="38" y="2" width="4" height="27" rx="2" fill="white" opacity="0.95"/>
        {/* Ground line */}
        <rect x="0" y="29" width="44" height="1.5" rx="0.75" fill="rgba(255,255,255,0.18)"/>
        {/* Ball */}
        <circle cx="22" cy="36" r="4" fill="url(#ballGrad)"/>
        <circle cx="20.8" cy="34.8" r="1.1" fill="rgba(255,255,255,0.4)"/>
        <defs>
          <radialGradient id="ballGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#1aff88"/>
            <stop offset="100%" stopColor="#00b358"/>
          </radialGradient>
        </defs>
      </svg>
      <div className={styles.text}>
        <span className={styles.goal}>GOAL</span>
        <span className={styles.space} />
        <span className={styles.spot}>SPOT</span>
      </div>
    </div>
  );
}
