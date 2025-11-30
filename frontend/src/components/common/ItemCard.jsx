import { motion } from 'framer-motion';

const getRarityColor = (rarity) => {
  const colors = {
    common: 'from-gray-600 to-gray-700 border-gray-500',
    uncommon: 'from-green-600 to-green-700 border-green-500',
    rare: 'from-blue-600 to-blue-700 border-blue-500',
    epic: 'from-purple-600 to-purple-700 border-purple-500',
    legendary: 'from-yellow-600 to-yellow-700 border-yellow-500',
    mythic: 'from-red-600 to-red-700 border-red-500',
  };
  return colors[rarity?.toLowerCase()] || colors.common;
};

const ItemCard = ({ item, onClick, showPrice = true, showRarity = true, compact = false }) => {
  const rarityColor = getRarityColor(item.rarity);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`card-hover cursor-pointer p-3 border-2 bg-gradient-to-br ${rarityColor}`}
      >
        <div className="aspect-square bg-gray-900 rounded-lg mb-2 overflow-hidden">
          <img
            src={item.imageUrl || '/placeholder-item.png'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm font-semibold truncate">{item.name}</p>
        {showPrice && item.value && (
          <p className="text-xs text-gray-300">${item.value.toFixed(2)}</p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`card-hover cursor-pointer border-2 bg-gradient-to-br ${rarityColor}`}
    >
      <div className="aspect-square bg-gray-900 overflow-hidden">
        <img
          src={item.imageUrl || '/placeholder-item.png'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        {showRarity && (
          <span className={`badge badge-${item.rarity?.toLowerCase()} mb-2`}>
            {item.rarity}
          </span>
        )}
        
        <h3 className="font-semibold text-lg mb-1 truncate">{item.name}</h3>
        
        {item.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between">
          {showPrice && item.value && (
            <span className="text-xl font-bold text-primary-400">
              ${item.value.toFixed(2)}
            </span>
          )}
          
          {item.dropRate && (
            <span className="text-xs text-gray-400">
              {item.dropRate.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ItemCard;
