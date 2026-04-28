'use client';

import { useState } from 'react';
import { CarPart, carParts, getDamageColor, getDamageDescription } from '../utils/carPartsMapping';
import { DamageScores } from '../utils/damageCalculations';

export default function CarSkeleton({ damageScores }) {
  const [hoveredPart, setHoveredPart] = useState(null);

  const handlePartHover = (partId) => {
    setHoveredPart(partId);
  };

  const handlePartLeave = () => {
    setHoveredPart(null);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[2/1] bg-gray-50 rounded-lg p-4">
      <div className="relative">
        {/* SVG Container */}
        <div className="relative w-full h-full">
          <object
            data="/svg"
            type="image/svg+xml"
            className="w-full h-full"
          >
            <img src="/svg" alt="Araç Görseli" className="w-full h-full" />
          </object>

          {/* Interactive Overlay */}
          {carParts.map((part) => {
            const damageScore = damageScores[part.damageType];
            const isHovered = hoveredPart === part.id;
            const damageColor = getDamageColor(damageScore);
            const damageDescription = getDamageDescription(damageScore);

            return (
              <div
                key={part.id}
                className="absolute cursor-pointer transition-all duration-200"
                style={{
                  left: `${part.coordinates.x}px`,
                  top: `${part.coordinates.y}px`,
                  width: `${part.coordinates.width}px`,
                  height: `${part.coordinates.height}px`,
                  backgroundColor: isHovered ? `${damageColor}33` : 'transparent',
                  border: isHovered ? `2px solid ${damageColor}` : 'none',
                }}
                onMouseEnter={() => handlePartHover(part.id)}
                onMouseLeave={handlePartLeave}
              >
                {/* Bölge Noktası */}
                {!isHovered && (
                  <div
                    className="region-dot"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.25)',
                      border: '2px solid #3b82f6',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                )}
                {/* Tooltip */}
                {isHovered && (
                  <div
                    className={`absolute z-10 bg-white p-3 rounded-lg shadow-lg ${
                      part.tooltipPosition === 'top' ? 'bottom-full mb-2' :
                      part.tooltipPosition === 'bottom' ? 'top-full mt-2' :
                      part.tooltipPosition === 'left' ? 'right-full mr-2' :
                      'left-full ml-2'
                    }`}
                    style={{ minWidth: '200px' }}
                  >
                    <h3 className="font-semibold text-gray-900">{part.name}</h3>
                    <p className="text-sm text-gray-600">{part.description}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Hasar Durumu:</span>
                        <span className="text-sm" style={{ color: damageColor }}>
                          {damageDescription}
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${damageScore}%`,
                            backgroundColor: damageColor,
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Sağlık Oranı: {damageScore}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 