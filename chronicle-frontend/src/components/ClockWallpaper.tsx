import { useState, useEffect, useMemo } from 'react';
import './ClockWallpaper.css';

const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

interface Clock {
  id: number;
  x: number;
  y: number;
  size: number;
  timezone: number;
  distortionX: number;
  distortionY: number;
  skewX: number;
  skewY: number;
}

const timezones = [
  { offset: 0, label: 'UTC' },
  { offset: -5, label: 'EST' },
  { offset: -8, label: 'PST' },
  { offset: 1, label: 'CET' },
  { offset: 8, label: 'CST' },
  { offset: 9, label: 'JST' },
  { offset: 5.5, label: 'IST' },
];

function generateClocks(count: number): Clock[] {
  const clocks: Clock[] = [];
  
  for (let i = 0; i < count; i++) {
    clocks.push({
      id: i,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      size: 180 + Math.random() * 100,
      timezone: timezones[Math.floor(Math.random() * timezones.length)].offset,
      distortionX: 0.85 + Math.random() * 0.25,
      distortionY: 0.85 + Math.random() * 0.25,
      skewX: (Math.random() - 0.5) * 20,
      skewY: (Math.random() - 0.5) * 20,
    });
  }
  
  return clocks;
}

function getTime(offsetHours: number) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = new Date(utc + offsetHours * 3600000);
  return {
    hours: localTime.getHours(),
    minutes: localTime.getMinutes(),
    seconds: localTime.getSeconds(),
    milliseconds: localTime.getMilliseconds(),
  };
}

interface ClockFaceProps {
  size: number;
  timezone: number;
  distortionX: number;
  distortionY: number;
  skewX: number;
  skewY: number;
}

function ClockFace({ size, timezone, distortionX, distortionY, skewX, skewY }: ClockFaceProps) {
  const [time, setTime] = useState(() => getTime(timezone));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTime(timezone));
    }, 100);
    return () => clearInterval(interval);
  }, [timezone]);
  
  const smoothSeconds = time.seconds + time.milliseconds / 1000;
  const smoothMinutes = time.minutes + smoothSeconds / 60;
  const smoothHours = (time.hours % 12) + smoothMinutes / 60;
  
  const hourAngle = smoothHours * 30;
  const minuteAngle = smoothMinutes * 6;
  const secondAngle = smoothSeconds * 6;

  return (
    <div
      className="clock"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="clock-svg"
        style={{
          transform: `scale(${distortionX}, ${distortionY}) skew(${skewX}deg, ${skewY}deg)`,
        }}
      >
        <defs>
          <filter id={`glow-${timezone}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const outerR = 78;
          const innerR = 68;
          const x1 = 100 + outerR * Math.cos(angle);
          const y1 = 100 + outerR * Math.sin(angle);
          const x2 = 100 + innerR * Math.cos(angle);
          const y2 = 100 + innerR * Math.sin(angle);
          
          return (
            <line
              key={`mark-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
            />
          );
        })}
        
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const r = 58;
          const x = 100 + r * Math.cos(angle);
          const y = 100 + r * Math.sin(angle);
          
          return (
            <text
              key={`num-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'Times New Roman', serif"
              fontSize="10"
              fontStyle="italic"
              fill="rgba(255,255,255,0.7)"
              filter={`url(#glow-${timezone})`}
            >
              {ROMAN_NUMERALS[i]}
            </text>
          );
        })}
        
        <line
          x1="100"
          y1="100"
          x2="100"
          y2={100 - size * 0.16}
          style={{ transform: `rotate(${hourAngle}deg)`, transformOrigin: '100px 100px' }}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="100"
          y1="100"
          x2="100"
          y2={100 - size * 0.26}
          style={{ transform: `rotate(${minuteAngle}deg)`, transformOrigin: '100px 100px' }}
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="100"
          y1="100"
          x2="100"
          y2={100 - size * 0.35}
          style={{ transform: `rotate(${secondAngle}deg)`, transformOrigin: '100px 100px', transition: 'transform 0.08s linear' }}
          stroke="rgba(255,150,150,0.95)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        <circle cx="100" cy="100" r="4" fill="rgba(255,255,255,0.95)" />
      </svg>
    </div>
  );
}

export default function ClockWallpaper() {
  const clocks = useMemo(() => generateClocks(10), []);
  
  return (
    <div className="clock-wallpaper">
      {clocks.map((clock) => (
        <div
          key={clock.id}
          className="clock-container"
          style={{
            left: `${clock.x}%`,
            top: `${clock.y}%`,
            animationDelay: `${clock.id * 0.2}s`,
          }}
        >
          <ClockFace
            size={clock.size}
            timezone={clock.timezone}
            distortionX={clock.distortionX}
            distortionY={clock.distortionY}
            skewX={clock.skewX}
            skewY={clock.skewY}
          />
        </div>
      ))}
    </div>
  );
}