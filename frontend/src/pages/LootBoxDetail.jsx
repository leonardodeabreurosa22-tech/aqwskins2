import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import lootboxService from '@services/lootboxService';
import useAuthStore from '@store/authStore';
import Loading from '@components/common/Loading';
import LootBoxOpeningModal from '@components/lootbox/LootBoxOpeningModal';

const LootBoxDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const [lootbox, setLootbox] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadLootBox();
  }, [id]);

  const loadLootBox = async () => {
    try {
      const [boxResponse, itemsResponse] = await Promise.all([
        lootboxService.getById(id),
        lootboxService.getItems(id),
      ]);
      setLootbox(boxResponse?.data || null);
      setItems(itemsResponse?.data?.items || []);
    } catch (error) {
      console.error('Failed to load loot box:', error);
      toast.error('Failed to load loot box');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to open cases');
      return;
    }

    if (!user || user.balance < lootbox.price) {
      toast.error('Insufficient balance');
      return;
    }

    setShowOpeningModal(true);
  };

  const handleOpen = async () => {
    setOpening(true);
    try {
      const result = await lootboxService.open(id);
      return result;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open case');
      throw error;
    } finally {
      setOpening(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900">{/* Header */}
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
            R${parseFloat(lootbox.price || 0).toFixed(2)}
          </motion.p>
        </div>

        {/* Preview Roller */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-blue-500/30"
        >
          <div className="overflow-hidden">
            <div className="flex gap-4 animate-scroll-slow">
              {[...items, ...items].slice(0, 8).map((item, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-40 h-40 bg-gray-800/50 rounded-xl p-3 border-2 transition-all hover:scale-105"
                  style={{ borderColor: getRarityColor(item.rarity) }}
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-24 object-contain mb-2"
                  />
                  <p className="text-xs text-center truncate text-gray-300">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Open Button */}
        <div className="flex justify-center mb-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenClick}
            disabled={!isAuthenticated || !user || (user?.balance || 0) < (lootbox?.price || 0)}
            className="px-16 py-5 text-xl font-bold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-blue-500/50 transition-all"
          >
            Open for R${parseFloat(lootbox.price || 0).toFixed(2)}
          </motion.button>
        </div>

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

      {/* Opening Modal */}
      {showOpeningModal && (
        <LootBoxOpeningModal
          isOpen={showOpeningModal}
          onClose={() => setShowOpeningModal(false)}
          lootbox={lootbox}
          onOpen={handleOpen}
          opening={opening}
        />
      )}

      <style jsx>{`
        @keyframes scroll-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-slow {
          animation: scroll-slow 20s linear infinite;
        }
        .animate-scroll-slow:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default LootBoxDetail;

                {isAuthenticated && user && (user?.balance || 0) < (lootbox?.price || 0) && (
                  <p className="text-red-400 text-sm mt-2 text-center">
                    {t('lootbox.insufficientBalance')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">{t('lootbox.contains')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} showPrice showRarity />
              ))}
            </div>
          </div>
        </div>

        {/* Opening Modal */}
        <LootBoxOpeningModal
          isOpen={showOpeningModal}
          onClose={() => setShowOpeningModal(false)}
          lootbox={lootbox}
          onOpen={handleOpen}
          opening={opening}
        />
      </div>
    </div>
  );
};

export default LootBoxDetail;