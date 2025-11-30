import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useAnimation } from 'framer-motion';
import { FiChevronLeft, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import lootboxService from '@services/lootboxService';
import useAuthStore from '@store/authStore';
import Loading from '@components/common/Loading';
import Button from '@components/common/Button';

const LootBoxDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const [lootbox, setLootbox] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonItem, setWonItem] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef(null);

  useEffect(() => {
    loadLootBox();
  }, [id]);

  const loadLootBox = async () => {
    try {
      const [boxResponse, itemsResponse] = await Promise.all([
        lootboxService.getById(id),
        lootboxService.getItems(id),
      ]);
      setLootbox(boxResponse?.data?.lootbox || boxResponse?.data || null);
      setItems(itemsResponse?.data?.items || []);
    } catch (error) {
      console.error('Failed to load loot box:', error);
      toast.error('Failed to load loot box');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to open cases');
      return;
    }

    if (!user || user.balance < lootbox.price) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    
    try {
      const result = await lootboxService.open(id);
      const item = result?.data?.item || result?.item;
      setWonItem(item);
      await startAnimation(item);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to open case');
      setIsSpinning(false);
    }
  };

  const startAnimation = async (item) => {
    const itemWidth = 150;
    const extendedItems = [...items, ...items, ...items, item, ...items, ...items];
    const wonItemIndex = items.length * 3;
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const finalOffset = -(wonItemIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

    // Initial fast spin
    await controls.start({
      x: -itemWidth * 5,
      transition: { duration: 0.5, ease: 'linear' }
    });

    // Main spin to won item
    await controls.start({
      x: finalOffset,
      transition: { duration: 5, ease: [0.25, 0.46, 0.45, 0.94] }
    });

    // Small bounce
    await controls.start({
      x: finalOffset + 20,
      transition: { duration: 0.1 }
    });

    await controls.start({
      x: finalOffset,
      transition: { duration: 0.2, ease: 'easeOut' }
    });

    setIsSpinning(false);
    setShowResult(true);

    // Confetti for rare items
    if (['epic', 'legendary', 'mythic'].includes(item?.rarity?.toLowerCase())) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: item.rarity === 'mythic' ? ['#eb4b4b'] : 
                item.rarity === 'legendary' ? ['#d32ce6'] : 
                ['#8847ff'],
      });
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'rgb(176, 195, 217)',
      uncommon: 'rgb(94, 152, 217)',
      rare: 'rgb(75, 105, 255)',
      epic: 'rgb(136, 71, 255)',
      legendary: 'rgb(211, 44, 230)',
      mythic: 'rgb(235, 75, 75)',
    };
    return colors[rarity?.toLowerCase()] || colors.common;
  };

  if (loading) return <Loading fullScreen />;
  if (!lootbox) return <div>Case not found</div>;

  const extendedItems = isSpinning || showResult 
    ? [...items, ...items, ...items, wonItem, ...items, ...items]
    : items.slice(0, 7);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/lootboxes')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <FiChevronLeft className="w-5 h-5" />
              <span>Back to cases</span>
            </button>
            
            <div className="flex items-center gap-6">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
              >
                {soundEnabled ? <FiVolume2 className="w-5 h-5" /> : <FiVolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Case Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            {lootbox.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-blue-400 font-semibold"
          >
            ${parseFloat(lootbox.price || 0).toFixed(2)}
          </motion.p>
        </div>

        {/* Roller Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-blue-500/30 relative"
        >
          {/* Center indicator */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 w-1 h-full pointer-events-none">
            <div className="w-full h-full bg-gradient-to-b from-transparent via-yellow-500 to-transparent opacity-80" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />
            </div>
          </div>

          <div ref={containerRef} className="overflow-hidden relative h-48">
            <motion.div
              className="flex gap-4 absolute"
              animate={controls}
              initial={{ x: 0 }}
              style={{ 
                justifyContent: isSpinning || showResult ? 'flex-start' : 'center',
                left: isSpinning || showResult ? 0 : '50%',
                transform: isSpinning || showResult ? 'none' : 'translateX(-50%)'
              }}
            >
              {extendedItems.map((item, idx) => (
                <div
                  key={`${item?.id}-${idx}`}
                  className="flex-shrink-0 w-40 bg-gray-800/50 rounded-xl p-3 border-2 transition-all"
                  style={{ borderColor: getRarityColor(item?.rarity) }}
                >
                  <img
                    src={item?.image_url}
                    alt={item?.name}
                    className="w-full h-24 object-contain mb-2"
                  />
                  <p className="text-xs text-center truncate text-gray-300">{item?.name}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Result Display */}
        {showResult && wonItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 text-center"
          >
            <h2 className="text-3xl font-bold mb-4 text-yellow-400">YOU WON!</h2>
            <div 
              className="inline-block bg-gray-800/50 rounded-xl p-6 border-4"
              style={{ borderColor: getRarityColor(wonItem.rarity) }}
            >
              <img
                src={wonItem.image_url}
                alt={wonItem.name}
                className="w-48 h-48 object-contain mx-auto mb-4"
              />
              <div
                className="text-sm font-bold px-3 py-1 rounded mb-2 uppercase inline-block"
                style={{ 
                  backgroundColor: getRarityColor(wonItem.rarity) + '20',
                  color: getRarityColor(wonItem.rarity)
                }}
              >
                {wonItem.rarity}
              </div>
              <p className="text-lg font-semibold text-white mb-4">{wonItem.name}</p>
              <p className="text-2xl font-bold text-green-400">${parseFloat(wonItem.value || 0).toFixed(2)}</p>
            </div>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/inventory')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
              >
                View Inventory
              </Button>
            </div>
          </motion.div>
        )}

        {/* Open Button */}
        {!showResult && (
          <div className="flex justify-center mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpen}
              disabled={isSpinning || !isAuthenticated || !user || (user?.balance || 0) < (lootbox?.price || 0)}
              className="px-16 py-5 text-xl font-bold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-blue-500/50 transition-all"
            >
              {isSpinning ? 'Opening...' : `Open for $${parseFloat(lootbox.price || 0).toFixed(2)}`}
            </motion.button>
          </div>
        )}

        {/* Case Contents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Case contents</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-800/50 rounded-xl p-4 border-2 hover:scale-105 transition-all cursor-pointer group"
                style={{ borderColor: getRarityColor(item.rarity) }}
              >
                <div className="relative mb-3">
                  <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold bg-black/50">
                    {parseFloat(item.drop_rate || 0).toFixed(2)}%
                  </div>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-32 object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
                
                <div className="space-y-1">
                  <div
                    className="text-xs font-bold px-2 py-1 rounded text-center uppercase"
                    style={{ 
                      backgroundColor: getRarityColor(item.rarity) + '20',
                      color: getRarityColor(item.rarity)
                    }}
                  >
                    {item.rarity}
                  </div>
                  
                  <p className="text-sm text-center text-gray-300 line-clamp-2 min-h-[2.5rem]">
                    {item.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LootBoxDetail;