import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ItemRoller = ({ items, winningItem, onComplete }) => {
  const [isRolling, setIsRolling] = useState(false);
  const rollerRef = useRef(null);

  useEffect(() => {
    if (items && items.length > 0 && winningItem) {
      startRoll();
    }
  }, [items, winningItem]);

  const startRoll = () => {
    setIsRolling(true);

    // Create extended list with winning item at the end
    const extendedItems = [
      ...items,
      ...items,
      ...items,
      ...items.slice(0, Math.floor(items.length / 2)),
      winningItem,
    ];

    // Calculate position to center winning item
    const itemWidth = 150; // width + gap
    const winningIndex = extendedItems.length - 1;
    const finalPosition = -(winningIndex * itemWidth) + (window.innerWidth / 2) - 75;

    // Animate to winning position
    setTimeout(() => {
      if (rollerRef.current) {
        rollerRef.current.style.transform = `translateX(${finalPosition}px)`;
        rollerRef.current.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
      }

      setTimeout(() => {
        setIsRolling(false);
        if (onComplete) onComplete();
      }, 4000);
    }, 100);
  };

  const getRarityBorder = (rarity) => {
    const borders = {
      common: 'border-gray-500',
      uncommon: 'border-green-500',
      rare: 'border-blue-500',
      epic: 'border-purple-500',
      legendary: 'border-yellow-500',
      mythic: 'border-red-500',
    };
    return borders[rarity?.toLowerCase()] || borders.common;
  };

  return (
    <div className="relative overflow-hidden h-64 bg-gray-900 rounded-xl">
      {/* Center indicator */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary-500 z-10 transform -translate-x-1/2"></div>
      <div className="absolute left-1/2 top-0 h-full w-32 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent z-10 transform -translate-x-1/2 pointer-events-none"></div>

      {/* Items roller */}
      <div className="absolute inset-0 flex items-center">
        <div
          ref={rollerRef}
          className="flex gap-4 px-4"
          style={{ transform: 'translateX(50%)' }}
        >
          {items && items.map((item, index) => (
            <motion.div
              key={`item-${index}`}
              className={`flex-shrink-0 w-32 h-32 bg-gray-800 rounded-lg border-4 ${getRarityBorder(item.rarity)} overflow-hidden`}
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={item.imageUrl || '/placeholder-item.png'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemRoller;
