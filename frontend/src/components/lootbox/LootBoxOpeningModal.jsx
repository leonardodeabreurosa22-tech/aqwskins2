import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import Modal from '@components/common/Modal';
import Button from '@components/common/Button';
import CaseOpeningAnimation from './CaseOpeningAnimation';

const LootBoxOpeningModal = ({ isOpen, onClose, lootbox, onOpen, opening }) => {
  const { t } = useTranslation();
  const [stage, setStage] = useState('ready'); // ready, spinning, result
  const [wonItem, setWonItem] = useState(null);
  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setStage('ready');
      setWonItem(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Generate items for animation from lootbox items
    if (lootbox?.items) {
      const items = lootbox.items.map(item => ({
        ...item,
        id: item.id || Math.random(),
      }));
      setAllItems(items);
    }
  }, [lootbox]);

  const handleOpen = async () => {
    try {
      const result = await onOpen();
      const item = result?.data?.item || result?.item;
      
      if (item) {
        setWonItem(item);
        setStage('spinning');
      } else {
        console.error('No item returned from opening');
        setStage('ready');
      }
    } catch (error) {
      setStage('ready');
      console.error('Error opening lootbox:', error);
    }
  };

  const handleAnimationComplete = () => {
    setStage('result');
    
    // Trigger confetti for rare items
    if (['epic', 'legendary', 'mythic'].includes(wonItem?.rarity?.toLowerCase())) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: wonItem.rarity === 'mythic' ? ['#ef4444', '#dc2626'] : 
                wonItem.rarity === 'legendary' ? ['#f59e0b', '#d97706'] : 
                ['#a855f7', '#9333ea'],
      });
    }
  };

  const getRarityGradient = (rarity) => {
    const gradients = {
      common: 'from-gray-600 to-gray-700',
      uncommon: 'from-green-600 to-green-700',
      rare: 'from-blue-600 to-blue-700',
      epic: 'from-purple-600 to-purple-700',
      legendary: 'from-yellow-600 to-orange-700',
      mythic: 'from-red-600 to-pink-700',
    };
    return gradients[rarity?.toLowerCase()] || gradients.common;
  };

  return (
    <Modal isOpen={isOpen} onClose={stage === 'result' ? onClose : null} size="full" showClose={false}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        {/* Close button - only show when not spinning */}
        {stage !== 'spinning' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* Ready Stage */}
          {stage === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-screen p-8"
            >
              <div className="text-center space-y-8 max-w-md">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-64 h-64 mx-auto bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-600/50"
                >
                  <div className="text-8xl">📦</div>
                </motion.div>

                <div>
                  <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                    {lootbox?.name}
                  </h2>
                  <p className="text-gray-400 text-lg mb-6">{lootbox?.description}</p>
                  <div className="text-3xl font-bold text-yellow-500 mb-8">
                    ${parseFloat(lootbox?.price || 0).toFixed(2)}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleOpen}
                  loading={opening}
                  className="min-w-[250px] text-xl py-4"
                >
                  {t('lootbox.open') || 'OPEN CASE'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Spinning Stage */}
          {stage === 'spinning' && wonItem && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex flex-col items-center justify-center"
            >
              <h2 className="text-3xl font-bold mb-8">Opening {lootbox?.name}...</h2>
              <CaseOpeningAnimation
                items={allItems}
                wonItem={wonItem}
                onComplete={handleAnimationComplete}
              />
            </motion.div>
          )}

          {/* Result Stage */}
          {stage === 'result' && wonItem && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-3xl font-bold gradient-text mb-4">
                {t('lootbox.congratulations')}
              </div>

              <div className={`w-48 h-48 mx-auto bg-gradient-to-br ${getRarityGradient(wonItem.rarity)} rounded-2xl p-3 shadow-glow-lg border-4 border-white/20`}>
                <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden">
                  <img
                    src={wonItem.imageUrl || '/placeholder-item.png'}
                    alt={wonItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <span className={`badge badge-${wonItem.rarity?.toLowerCase()} mb-3`}>
                  {wonItem.rarity}
                </span>
                <h3 className="text-2xl font-bold mb-2">{wonItem.name}</h3>
                <p className="text-gray-400 mb-4">{wonItem.description}</p>
                <div className="text-3xl font-bold text-primary-400">
                  ${wonItem.value?.toFixed(2)}
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setStage('ready');
                    setWonItem(null);
                  }}
                >
                  Open Another
                </Button>
              </div>
            </motion.div>
          )}