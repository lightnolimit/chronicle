import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useButterfly } from '../context/ButterflyContext';
import './Butterflies.css';

interface Butterfly {
  id: number;
  baseX: number;
  baseY: number;
  size: number;
  delay: number;
  flutterAngle: number;
}

function generateButterflies(count: number): Butterfly[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    baseX: 10 + Math.random() * 80,
    baseY: 10 + Math.random() * 80,
    size: 20 + Math.random() * 12,
    delay: Math.random() * 1,
    flutterAngle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
  }));
}

interface ButterflyProps {
  butterfly: Butterfly;
  isFluttering: boolean;
}

function Butterfly({ butterfly, isFluttering }: ButterflyProps) {
  const [wingPhase, setWingPhase] = useState(0);
  const [idleOffset, setIdleOffset] = useState({ x: 0, y: 0 });
  const [flyingOffset, setFlyingOffset] = useState({ x: 0, y: 0 });
  const [hasFlown, setHasFlown] = useState(false);
  const phaseRef = useRef(Math.random() * Math.PI * 2);
  const animRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const interval = setInterval(() => {
      setWingPhase((p) => p + 0.5);
      phaseRef.current += 0.025;
      const newX = Math.sin(phaseRef.current) * 4 + Math.sin(phaseRef.current * 2.3) * 2;
      const newY = Math.cos(phaseRef.current * 1.7) * 3 + Math.sin(phaseRef.current * 0.8) * 1.5;
      setIdleOffset({ x: newX, y: newY });
    }, 35);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isFluttering && !hasFlown) {
      setHasFlown(true);
      const angle = butterfly.flutterAngle;
      const distance = 60 + Math.random() * 40;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - 30;
      
      const startTime = Date.now();
      const duration = 2500;
      
      const animateFlutter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const wobbleX = Math.sin(progress * Math.PI * 4) * (1 - eased) * 15;
        const wobbleY = Math.cos(progress * Math.PI * 3) * (1 - eased) * 10;
        
        setFlyingOffset({
          x: targetX * eased + wobbleX,
          y: targetY * eased + wobbleY,
        });
        
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animateFlutter);
        }
      };
      
      animRef.current = requestAnimationFrame(animateFlutter);
    } else if (!isFluttering) {
      setHasFlown(false);
      setFlyingOffset({ x: 0, y: 0 });
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    }
    
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isFluttering, hasFlown, butterfly.flutterAngle]);

  const wingRotation = Math.sin(wingPhase) * 35;
  const currentX = isFluttering ? flyingOffset.x : idleOffset.x;
  const currentY = isFluttering ? flyingOffset.y : idleOffset.y;
  const rotation = isFluttering 
    ? Math.sin(Date.now() * 0.01) * 10 
    : Math.sin(phaseRef.current * 3) * 12;

  return (
    <motion.div
      className="butterfly"
      style={{
        left: `${butterfly.baseX}%`,
        top: `${butterfly.baseY}%`,
        width: butterfly.size,
        height: butterfly.size,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 0.8,
        scale: 1,
        x: currentX,
        y: currentY,
        rotate: rotation,
      }}
      transition={{
        opacity: { delay: butterfly.delay, duration: 1 },
        scale: { delay: butterfly.delay, duration: 0.5 },
        x: { duration: 0.05, ease: 'linear' },
        y: { duration: 0.05, ease: 'linear' },
        rotate: { duration: 0.05, ease: 'linear' },
      }}
    >
      <svg viewBox="0 0 40 40" className="butterfly-svg">
        <defs>
          <linearGradient id={`bf-grad-${butterfly.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#90CAF9" />
            <stop offset="40%" stopColor="#42A5F5" />
            <stop offset="100%" stopColor="#1565C0" />
          </linearGradient>
          <filter id={`bf-glow-${butterfly.id}`}>
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <g filter={`url(#bf-glow-${butterfly.id})`}>
          <path
            d="M20 17 Q5 5 9 15 Q11 21 20 19 Q29 21 31 15 Q35 5 20 17"
            fill={`url(#bf-grad-${butterfly.id})`}
            style={{
              transform: `scaleX(${Math.cos(wingRotation * Math.PI / 180)}) rotate(${-wingRotation * 0.25}deg)`,
              transformOrigin: '20px 17px',
              transition: 'transform 0.035s linear',
            }}
          />
          <path
            d="M20 17 Q35 5 31 15 Q29 21 20 19 Q11 21 9 15 Q5 5 20 17"
            fill={`url(#bf-grad-${butterfly.id})`}
            style={{
              transform: `scaleX(${Math.cos(wingRotation * Math.PI / 180)}) rotate(${wingRotation * 0.25}deg)`,
              transformOrigin: '20px 17px',
              transition: 'transform 0.035s linear',
            }}
          />
        </g>
        
        <line x1="20" y1="17" x2="20" y2="35" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
        <ellipse cx="20" cy="15" rx="2.5" ry="3.5" fill="#0D47A1" />
      </svg>
    </motion.div>
  );
}

export default function Butterflies() {
  const { isFluttering } = useButterfly();
  const butterflies = useMemo(() => generateButterflies(10), []);

  return (
    <div className="butterflies-container">
      {butterflies.map((butterfly) => (
        <Butterfly
          key={butterfly.id}
          butterfly={butterfly}
          isFluttering={isFluttering}
        />
      ))}
    </div>
  );
}
