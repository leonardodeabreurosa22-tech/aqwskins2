import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useAnimation } from 'framer-motion';
import { FiChevronLeft, FiVolume2, FiVolumeX, FiRefreshCw, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import lootboxService from '@services/lootboxService';
import useAuthStore from '@store/authStore';
import Loading from '@components/common/Loading';

const LootBoxDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user, updateUser, logout } = useAuthStore();
  const [lootbox, setLootbox] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonItem, setWonItem] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
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
      
      // Sort items by rarity (rarest first)
      const rarityOrder = { mythic: 0, legendary: 1, epic: 2, rare: 3, uncommon: 4, common: 5 };
      const sortedItems = (itemsResponse?.data?.items || []).sort((a, b) => {
        const orderA = rarityOrder[a.rarity?.toLowerCase()] ?? 999;
        const orderB = rarityOrder[b.rarity?.toLowerCase()] ?? 999;
        return orderA - orderB;
      });
      
      setItems(sortedItems);
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

    const userBalance = parseFloat(user?.balance || 0);
    const boxPrice = parseFloat(lootbox?.price || 0);

    if (!user || userBalance < boxPrice) {
      toast.error(`Insufficient balance. You have $${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} but need $${boxPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    
    try {
      const result = await lootboxService.open(id);
      const item = result?.data?.opening?.item || result?.data?.item || result?.item;
      setWonItem(item);
      
      // Update user balance
      if (result?.data?.opening?.newBalance !== undefined) {
        updateUser({ balance: result.data.opening.newBalance });
      }
      
      await startAnimation(item);
    } catch (error) {
      console.error('Error opening lootbox:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to open case');
      }
      
      setIsSpinning(false);
    }
  };

  const startAnimation = async (item) => {
    const itemWidth = 180;
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const extendedItems = [...items, ...items, ...items, item, ...items, ...items];
    const wonItemIndex = items.length * 3;
    
    const finalOffset = -(wonItemIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

    await controls.start({
      x: finalOffset,
      transition: { 
        duration: 7,
        ease: [0.22, 1, 0.36, 1]
      }
    });

    await controls.start({
      x: finalOffset + 15,
      transition: { duration: 0.15, ease: 'easeOut' }
    });

    await controls.start({
      x: finalOffset,
      transition: { duration: 0.25, ease: 'easeInOut' }
    });

    setCurrentOffset(finalOffset);
    setIsSpinning(false);
    setShowResult(true);

    if (['epic', 'legendary', 'mythic'].includes(item?.rarity?.toLowerCase())) {
      const colors = item.rarity === 'mythic' ? ['#eb4b4b', '#ff6b6b'] : 
                     item.rarity === 'legendary' ? ['#d32ce6', '#ff48ff'] : 
                     ['#8847ff', '#a66fff'];
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors,
        ticks: 200,
        gravity: 0.8,
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 250);
    }
  };

  const handleOpenAgain = () => {
    setShowResult(false);
    setWonItem(null);
    handleOpen();
  };

  const handleSellItem = async () => {
    if (!wonItem) return;
    
    try {
      // TODO: Implement sell functionality
      const sellValue = parseFloat(wonItem.value || 0);
      updateUser({ balance: parseFloat(user.balance) + sellValue });
      toast.success(`Item sold for $${sellValue.toFixed(2)}`);
      setShowResult(false);
      setWonItem(null);
    } catch (error) {
      toast.error('Failed to sell item');
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
    : items;

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
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
            >
              {soundEnabled ? <FiVolume2 className="w-5 h-5" /> : <FiVolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Case Header */}
        <div className="text-center mb-8">
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
            className="text-2xl text-blue-400 font-semibold"
          >
            ${parseFloat(lootbox.price || 0).toFixed(2)}
          </motion.p>
        </div>

        {/* Top Preview Row */}
        <div className="mb-8 overflow-hidden">
          <div className="flex gap-4 justify-center px-4">
            {items.slice(0, 7).map((item, idx) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-32 sm:w-36 md:w-40"
              >
                <div 
                  className="bg-gray-800/50 rounded-xl p-3 border-2 transition-all hover:scale-105"
                  style={{ borderColor: getRarityColor(item.rarity) }}
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-24 object-contain mb-2"
                  />
                  <p className="text-xs text-center truncate text-gray-300">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roller Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-blue-500/30 relative overflow-hidden"
        >
          {/* Center indicator */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 w-1 h-full pointer-events-none">
            <div className="w-full h-full bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-90" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-5 h-5 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 animate-pulse" />
            </div>
          </div>

          <div ref={containerRef} className="overflow-hidden relative h-56">
            <motion.div
              className="flex gap-6 absolute"
              animate={controls}
              initial={{ x: currentOffset }}
              style={{ 
                left: '50%',
                x: currentOffset
              }}
            >
              {extendedItems.map((item, idx) => (
                <div
                  key={`${item?.id}-${idx}`}
                  className="flex-shrink-0 w-44"
                >
                  <div
                    className="bg-gray-800/70 rounded-xl p-4 border-2 transition-all h-full flex flex-col"
                    style={{ borderColor: getRarityColor(item?.rarity) }}
                  >
                    <img
                      src={item?.image_url}
                      alt={item?.name}
                      className="w-full h-32 object-contain mb-3"
                    />
                    <p className="text-sm text-center truncate text-gray-200 font-medium">{item?.name}</p>
                  </div>
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
            className="mb-8"
          >
            <h2 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              YOU WON!
            </h2>
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenAgain}
                disabled={!isAuthenticated || parseFloat(user?.balance || 0) < parseFloat(lootbox?.price || 0)}
                className="flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all"
              >
                <FiRefreshCw className="w-5 h-5" />
                Open Again ${parseFloat(lootbox.price || 0).toFixed(2)}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSellItem}
                className="flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl transition-all"
              >
                <FiDollarSign className="w-5 h-5" />
                Sell for ${parseFloat(wonItem.value || 0).toFixed(2)}
              </motion.button>
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
              disabled={isSpinning || !isAuthenticated || !user || parseFloat(user?.balance || 0) < parseFloat(lootbox?.price || 0)}
              className="px-20 py-6 text-2xl font-bold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-blue-500/50 transition-all"
            >
              {isSpinning ? 'Opening...' : `Open for $${parseFloat(lootbox.price || 0).toFixed(2)}`}
            </motion.button>
          </div>
        )}

        {/* Case Contents */}
        <div>
          <h2 className="text-3xl font-bold mb-6 text-center">Case contents</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative group"
              >
                <div
                  className="bg-gray-800/50 rounded-lg overflow-hidden border-2 hover:scale-105 transition-all cursor-pointer"
                  style={{ borderColor: getRarityColor(item.rarity) }}
                >
                  {/* Probability Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="px-2 py-1 rounded text-xs font-bold bg-black/70 text-white">
                      {typeof item.probability === 'number' 
                        ? `${item.probability.toFixed(2)}%` 
                        : item.probability || '0.00%'}
                    </div>
                  </div>

                  {/* Item Image */}
                  <div className="aspect-square flex items-center justify-center p-4 bg-gray-900/30">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>

                  {/* Item Info */}
                  <div className="p-3 space-y-2">
                    <div
                      className="text-xs font-bold px-2 py-1 rounded text-center uppercase"
                      style={{ 
                        backgroundColor: getRarityColor(item.rarity) + '20',
                        color: getRarityColor(item.rarity)
                      }}
                    >
                      {item.rarity}
                    </div>
                    
                    <p className="text-sm text-center text-gray-200 font-medium line-clamp-2 min-h-[2.5rem]">
                      {item.name}
                    </p>

                    <p className="text-center text-green-400 font-bold">
                      ${parseFloat(item.value || 0).toFixed(2)}
                    </p>
                  </div>
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
