import React, { useEffect, useState } from 'react';

interface FloatingParticleProps {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  animationDuration: number;
  animationDelay: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'diagonal';
}

const FloatingParticle: React.FC<FloatingParticleProps> = ({
  x, y, size, color, opacity, animationDuration, animationDelay, direction
}) => {
  const [position, setPosition] = useState({ x, y });
  const animationRef = React.useRef<number>();

  React.useEffect(() => {
    const animate = () => {
      setPosition(prev => {
        const speed = 0.5;
        let newX = prev.x;
        let newY = prev.y;

        switch (direction) {
          case 'up':
            newY = (newY - speed) % window.innerHeight;
            if (newY < -size) newY = window.innerHeight;
            break;
          case 'down':
            newY = (newY + speed) % window.innerHeight;
            if (newY > window.innerHeight) newY = -size;
            break;
          case 'left':
            newX = (newX - speed) % window.innerWidth;
            if (newX < -size) newX = window.innerWidth;
            break;
          case 'right':
            newX = (newX + speed) % window.innerWidth;
            if (newX > window.innerWidth) newX = -size;
            break;
          case 'diagonal':
            newX = (newX + speed * 0.7) % window.innerWidth;
            newY = (newY - speed * 0.7) % window.innerHeight;
            if (newX < -size) newX = window.innerWidth;
            if (newY < -size) newY = window.innerHeight;
            break;
        }

        return { x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [direction, size]);

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
        animationDelay: `${animationDelay}s`,
        transition: 'all 0.3s ease-out',
      }}
    />
  );
};

interface AnimatedCharactersProps {
  passwordFocused: boolean;
  isPasswordVisible: boolean;
  isTyping: boolean;
}

export const AnimatedCharacters: React.FC<AnimatedCharactersProps> = ({
  passwordFocused,
  isPasswordVisible,
  isTyping
}) => {
  const [particles, setParticles] = React.useState<FloatingParticleProps[]>([]);

  React.useEffect(() => {
    // Create initial particles
    const initialParticles: FloatingParticleProps[] = [
      // Top area floating particles
      { id: 1, x: 100, y: 50, size: 8, color: '#3b82f6', opacity: 0.6, animationDuration: 20, animationDelay: 0, direction: 'right' as const },
      { id: 2, x: 200, y: 30, size: 6, color: '#8b5cf6', opacity: 0.5, animationDuration: 25, animationDelay: 2, direction: 'down' as const },
      { id: 3, x: 300, y: 60, size: 10, color: '#06b6d4', opacity: 0.4, animationDuration: 18, animationDelay: 1, direction: 'left' as const },

      // Middle area particles
      { id: 4, x: 80, y: 200, size: 7, color: '#10b981', opacity: 0.5, animationDuration: 22, animationDelay: 1.5, direction: 'up' as const },
      { id: 5, x: 320, y: 180, size: 9, color: '#f59e0b', opacity: 0.6, animationDuration: 16, animationDelay: 0.5, direction: 'diagonal' as const },
      { id: 6, x: 180, y: 220, size: 5, color: '#ef4444', opacity: 0.4, animationDuration: 24, animationDelay: 2.5, direction: 'right' as const },

      // Bottom area particles
      { id: 7, x: 120, y: 350, size: 8, color: '#8b5cf6', opacity: 0.5, animationDuration: 20, animationDelay: 1, direction: 'up' as const },
      { id: 8, x: 280, y: 380, size: 6, color: '#06b6d4', opacity: 0.6, animationDuration: 18, animationDelay: 3, direction: 'left' as const },

      // Corner accent particles
      { id: 9, x: 30, y: 30, size: 5, color: '#10b981', opacity: 0.4, animationDuration: 26, animationDelay: 0.8, direction: 'diagonal' as const },
      { id: 10, x: 350, y: 50, size: 7, color: '#f59e0b', opacity: 0.5, animationDuration: 22, animationDelay: 1.8, direction: 'down' as const },

      // Background subtle particles
      { id: 11, x: 50, y: 150, size: 4, color: '#3b82f6', opacity: 0.3, animationDuration: 28, animationDelay: 0.3, direction: 'right' as const },
      { id: 12, x: 310, y: 280, size: 6, color: '#8b5cf6', opacity: 0.4, animationDuration: 24, animationDelay: 2.2, direction: 'up' as const },
    ];

    setParticles(initialParticles);

    // Add more particles when password is focused
    if (passwordFocused) {
      const additionalParticles: FloatingParticleProps[] = [
        { id: 13, x: 150, y: 120, size: 12, color: '#ef4444', opacity: 0.7, animationDuration: 15, animationDelay: 0, direction: 'diagonal' as const },
        { id: 14, x: 250, y: 200, size: 10, color: '#f59e0b', opacity: 0.6, animationDuration: 18, animationDelay: 0.5, direction: 'up' as const },
        { id: 15, x: 100, y: 250, size: 8, color: '#10b981', opacity: 0.5, animationDuration: 20, animationDelay: 1, direction: 'right' as const },
      ];
      setParticles(prev => [...prev, ...additionalParticles]);
    }
  }, [passwordFocused]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="relative w-full h-full">
        {particles.map((particle) => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}

        {/* Additional static design elements */}
        <div className="absolute top-10 left-10 opacity-20">
          <div className="w-16 h-16 border-2 border-blue-300 rounded-full animate-pulse"></div>
        </div>

        <div className="absolute bottom-10 right-10 opacity-20">
          <div className="w-12 h-12 border-2 border-purple-300 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
        </div>

        <div className="absolute top-1/2 left-5 opacity-15">
          <div className="w-8 h-8 bg-cyan-300 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        </div>
      </div>
    </div>
  );
};
