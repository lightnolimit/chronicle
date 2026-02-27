import React from 'react';

export function DesktopIcon({ icon, label, onDoubleClick }: { icon: string; label: string; onDoubleClick: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    computer: (
      <svg width="40" viewBox="0 0 37 46" fill="none">
        <rect x="1" y="0.5" width="35" height="39" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="5" y="4.5" width="27" height="20" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="3" y="39.5" width="31" height="6" fill="white" stroke="black" strokeWidth="1.5"/>
        <line x1="18.5" y1="31.5" x2="30.5" y2="31.5" stroke="black" />
      </svg>
    ),
    documents: (
      <svg width="45" viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <path d="M6.59 47V29.75C6.59 28.65 7.48 27.75 8.59 27.75H37.94C39.05 27.75 39.94 28.65 39.94 29.75V47" stroke="black" strokeWidth="1.5"/>
        <rect x="23.5" y="4" width="5.88" height="8.79" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="10" y="12" width="26" height="3" fill="white" stroke="black" strokeWidth="1"/>
        <rect x="10" y="18" width="26" height="3" fill="white" stroke="black" strokeWidth="1"/>
        <rect x="10" y="24" width="20" height="3" fill="white" stroke="black" strokeWidth="1"/>
      </svg>
    ),
    notepad: (
      <svg width="45" viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <path d="M6.59 47V29.75C6.59 28.65 7.48 27.75 8.59 27.75H37.94C39.05 27.75 39.94 28.65 39.94 29.75V47" stroke="black" strokeWidth="1.5"/>
        <rect x="23.5" y="4" width="5.88" height="8.79" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
      </svg>
    ),
    trash: (
      <svg width="32" viewBox="0 0 32 46" fill="none">
        <rect x="12.5" y="0.5" width="8" height="2" fill="white" stroke="black"/>
        <rect x="0.5" y="2.5" width="31" height="3" fill="white" stroke="black"/>
        <path d="M1.5 5.4H30.5V44C30.5 44.8 29.83 45.5 29 45.5H3C2.17 45.5 1.5 44.8 1.5 44V5.4Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <path d="M6 9.8L6.9 10.7C7.28 11 7.5 11.6 7.5 12.1V39C7.5 39.7 7.16 40.4 6.59 40.7L6 41.1" stroke="black"/>
        <path d="M12 9.8L12.9 10.7C13.28 11 13.5 11.6 13.5 12.1V39C13.5 39.7 13.16 40.4 12.59 40.7L12 41.1" stroke="black"/>
        <path d="M18 9.8L18.9 10.7C19.28 11 19.5 11.6 19.5 12.1V39C19.5 39.7 19.16 40.4 18.59 40.7L18 41.1" stroke="black"/>
        <path d="M24 9.8L24.9 10.7C25.28 11 25.5 11.6 25.5 12.1V39C25.5 39.7 25.16 40.4 24.59 40.7L24 41.1" stroke="black"/>
      </svg>
    ),
    paint: (
      <svg width="47" viewBox="0 0 47 50" fill="none">
        <path d="M22.45 1L1.5 23.26L23.85 47L44.8 24.74L22.45 1Z" fill="white" stroke="black" strokeWidth="1.3"/>
        <path d="M34.33 22.77L41.31 30.19V39.1H38.52V37.61H28.04L26.64 36.13H25.25L21.06 31.68V30.19L22.45 28.71V27.23L26.64 22.77H34.33Z" fill="white" stroke="black"/>
        <rect x="41.31" y="29.45" width="4.19" height="11.87" fill="black"/>
        <rect x="25.25" y="29.45" width="4.19" height="1.48" fill="black"/>
      </svg>
    ),
    video: (
      <svg width="45" viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="8" y="12" width="24" height="18" fill="black" rx="1"/>
        <polygon points="18,16 18,30 30,21" fill="white"/>
      </svg>
    ),
    docs: (
      <svg width="45" viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <circle cx="23" cy="20" r="8" fill="white" stroke="black" strokeWidth="1.5"/>
        <circle cx="23" cy="20" r="3" fill="black"/>
        <path d="M23 12V8M23 28V32M12 20H8M34 20H38" stroke="black" strokeWidth="1.5"/>
      </svg>
    ),
  };

  return (
    <figure 
      className="desktop-icon"
      onDoubleClick={onDoubleClick}
    >
      {icons[icon] || icons.computer}
      <figcaption>{label}</figcaption>
    </figure>
  );
}