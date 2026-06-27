export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="40" fill="#006492"/>
      <path d="M100 45C85 45 75 55 75 70V110C75 135 90 150 100 155C110 150 125 135 125 110V70C125 55 115 45 100 45Z" fill="white"/>
      <path d="M100 80V120M80 100H120" stroke="#006492" strokeWidth="12" strokeLinecap="round"/>
      <path d="M70 140C85 145 115 145 130 140" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}
