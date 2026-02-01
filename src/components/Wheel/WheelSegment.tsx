'use client';

import React from 'react';
import { Question } from '@/types';
import { createWheelPath } from '@/utils/wheelMath';
import { getCategoryHex, getFallbackHex } from '@/lib/categoryColors';

interface WheelSegmentProps {
  question: Question;
  index: number;
  totalSegments: number;
  radius: number;
  centerX: number;
  centerY: number;
  isWinner?: boolean;
  isFlashing?: boolean;
  isPlaceholder?: boolean;
  selectedCategories?: string[];
  onHoverStart?: (index: number) => void;
  onHoverEnd?: () => void;
}

export function WheelSegment({
  question,
  index,
  totalSegments,
  radius,
  centerX,
  centerY,
  isWinner = false,
  isFlashing = false,
  isPlaceholder = false,
  selectedCategories,
  onHoverStart,
  onHoverEnd,
}: WheelSegmentProps) {
  const segmentAngle = 360 / totalSegments;
  const startAngle = index * segmentAngle - 90;
  const endAngle = startAngle + segmentAngle;

  const path = createWheelPath(centerX, centerY, radius, startAngle, endAngle);

  // Text positioned along the radial center of the segment, reading outward
  const midAngle = (startAngle + endAngle) / 2;
  const midAngleRad = (midAngle * Math.PI) / 180;

  // Place text start just outside the center button
  const startRadius = radius * 0.22;
  const textX = centerX + startRadius * Math.cos(midAngleRad);
  const textY = centerY + startRadius * Math.sin(midAngleRad);

  // Rotate text so it reads radially outward from center
  const textRotation = midAngle;

  // Resolve color -- use hex directly for SVG
  // If categories are filtered, use the first matching category's color
  const matchedCategory = !isPlaceholder && selectedCategories?.length
    ? question.categories?.find(c => selectedCategories.includes(c.name))
    : undefined;
  const fillColor = isPlaceholder
    ? getFallbackHex(index)
    : matchedCategory
      ? getCategoryHex(matchedCategory.name)
      : question.categories?.[0]
        ? getCategoryHex(question.categories[0].name)
        : getFallbackHex(index);

  // Fixed truncation for uniform label lengths
  const maxChars = 38;
  const label = question.text.length > maxChars
    ? question.text.substring(0, maxChars).trimEnd() + '...'
    : question.text;

  // Max text length for the radial space available
  const pegBuffer = 16;
  const maxTextLength = radius - startRadius - pegBuffer;

  // Dynamic font sizing: scale up short text to fill the segment
  const minFontSize = 8;
  const maxFontSize = 18;
  // Character width ratio ~0.6 of font size for average proportional text
  const charWidthRatio = 0.6;

  // Radial constraint: font size where text width fits maxTextLength
  const radialFontSize = maxTextLength / (label.length * charWidthRatio);

  // Angular constraint: font size that fits within the segment arc height
  // Arc height at the midpoint radius (~60% out) of the segment
  const midRadius = radius * 0.6;
  const segmentAngleRad = (segmentAngle * Math.PI) / 180;
  const arcHeight = midRadius * segmentAngleRad;
  // Leave padding so text doesn't touch segment edges
  const angularFontSize = arcHeight * 0.7;

  const fontSize = Math.max(minFontSize, Math.min(maxFontSize, radialFontSize, angularFontSize));

  // Check if text overflows at computed font size
  const approxTextWidth = label.length * charWidthRatio * fontSize;
  const needsTruncation = approxTextWidth > maxTextLength;

  return (
    <g
      onMouseEnter={isPlaceholder ? undefined : () => onHoverStart?.(index)}
      onMouseLeave={isPlaceholder ? undefined : () => onHoverEnd?.()}
      style={{ cursor: 'default' }}
    >
      <path
        d={path}
        fill={fillColor}
        stroke="#fafaf9"
        strokeWidth={1.5}
        style={{
          filter: isWinner ? 'brightness(1.08)' : 'none',
          animation: isFlashing ? 'segment-flash 0.3s ease-in-out 3' : 'none',
        }}
      />

      {!isPlaceholder && (
        <text
          x={textX}
          y={textY}
          textAnchor="start"
          dominantBaseline="middle"
          transform={`rotate(${textRotation}, ${textX}, ${textY})`}
          fill="#2a2a35"
          fontSize={fontSize}
          fontWeight="500"
          {...(needsTruncation ? { textLength: maxTextLength, lengthAdjust: 'spacing' } : {})}
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
