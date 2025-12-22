'use client';

import { useIsClient } from '@/hooks/useIsClient';
import { rand } from '@/utils/math';
import { Box } from 'lucide-react';
import { CSSProperties, useState } from 'react';

interface MagicTextProps {
  text: string;
}

const getRandomPosition = (): CSSProperties => ({
  left: `${rand(-10, 100)}%`,
  top: `${rand(-40, 80)}%`,
  rotate: `${rand(0, 360)}deg`,
});

export function MagicText({ text }: MagicTextProps) {
  const [iconPositions, setIconPositions] = useState<CSSProperties[]>(() =>
    Array.from({ length: 3 }, () => getRandomPosition())
  );

  const isClient = useIsClient();

  const handleIconAnimationEnd = (index: number) => {
    if (!isClient) return;

    setIconPositions((prev) => {
      const newPositions = [...prev];
      newPositions[index] = getRandomPosition();
      return newPositions;
    });
  };

  return (
    <span className="relative inline-block">
      {isClient &&
        iconPositions.map((position, index) => (
          <span
            key={index}
            className="animate-scale absolute flex items-center"
            style={position}
            onAnimationIteration={() => handleIconAnimationEnd(index)}>
            <span className="animate-rotate flex items-center not-italic opacity-80">
              <Box size={32} />
            </span>
          </span>
        ))}
      <span className="animate-background-pan via-card-foreground from-primary to-primary bg-linear-to-r bg-size-[200%] bg-clip-text whitespace-nowrap text-transparent">
        {text}
      </span>
    </span>
  );
}
