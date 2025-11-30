import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

const CaseOpeningAnimation = ({ items, wonItem, onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef(null);

  // Create extended items array for infinite scroll effect
  const extendedItems = [
    ...items,
    ...items,
    ...items,
    wonItem,
    ...items,
    ...items,
  ];

  const itemWidth = 150;
  const wonItemIndex = items.length * 3;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = async () => {
    setIsSpinning(true);

    // Calculate final position (center the won item)
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const finalOffset = -(wonItemIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

    // Initial fast spin
    await controls.start({
      x: -itemWidth * 5,
      transition: {
        duration: 0.5,
        ease: 'linear',
      },
    });

    // Main spin to won item
    await controls.start({
      x: finalOffset,
      transition: {
        duration: 5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    });

    // Small bounce effect
    await controls.start({
      x: finalOffset + 20,
      transition: { duration: 0.1 },
    });

    await controls.start({
      x: finalOffset,
      transition: { duration: 0.2, ease: 'easeOut' },
    });

    setIsSpinning(false);
    
    // Delay before showing result
    setTimeout(() => {
      onComplete?.();
    }, 500);
  };

  const getRarityGradient = (rarity) => {
    const gradients = {
      common: 'from-gray-500 to-gray-600',
      uncommon: 'from-green-500 to-green-600',
      rare: 'from-blue-500 to-blue-600',
      epic: 'from-purple-500 to-purple-600',
      legendary: 'from-yellow-500 to-orange-600',
      mythic: 'from-red-500 to-pink-600',
    };
    return gradients[rarity?.toLowerCase()] || gradients.common;
  };

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-gray-900 to-black py-12">
      {/* Center indicator */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 w-1 h-full">
        <div className="w-full h-full bg-gradient-to-b from-transparent via-yellow-500 to-transparent opacity-80" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />
        </div>
      </div>

      {/* Items container */}
      <div ref={containerRef} className="relative h-64 overflow-hidden">
        <motion.div
          className="flex gap-4 absolute"
          animate={controls}
          initial={{ x: 0 }}
        >
          {extendedItems.map((item, index) => (
            <div
              key={`${item?.id}-${index}`}
              className="flex-shrink-0"
              style={{ width: `${itemWidth}px` }}
            >
              <div
                className={`relative h-56 rounded-lg overflow-hidden border-2 ${
                  index === wonItemIndex
                    ? 'border-yellow-500 shadow-2xl shadow-yellow-500/50'
                    : 'border-gray-700'
                } bg-gradient-to-br ${getRarityGradient(item?.rarity)} p-1`}
              >
                <div className="w-full h-full bg-gray-900/90 rounded-md p-3 flex flex-col items-center justify-center">
                  {item?.image_url && (
                    <img
                      src={item.image_url}
                      alt={item?.name}
                      className="w-24 h-24 object-contain mb-2"
                    />
                  )}
                  <div className="text-center">
                    <p className="text-xs font-bold text-white truncate w-full">
                      {item?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ${parseFloat(item?.value || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded mt-2 bg-gradient-to-r ${getRarityGradient(item?.rarity)}`}>
                    {item?.rarity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-full bg-gradient-to-b from-yellow-500/20 via-transparent to-transparent blur-xl" />
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
