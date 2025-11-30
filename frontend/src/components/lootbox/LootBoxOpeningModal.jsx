import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPackage } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import Modal from '@components/common/Modal';
import Button from '@components/common/Button';

const LootBoxOpeningModal = ({ isOpen, onClose, lootbox, onOpen, opening }) => {
  const { t } = useTranslation();
  const [stage, setStage] = useState('ready'); // ready, spinning, revealing, result
  const [wonItem, setWonItem] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStage('ready');
      setWonItem(null);
    }
  }, [isOpen]);

  const handleOpen = async () => {
    setStage('spinning');
    
    try {
      const result = await onOpen();
      
      // Simulate spinning duration
      setTimeout(() => {
        setWonItem(result.item);
        setStage('revealing');
        
        // Trigger confetti for rare items
        if (['epic', 'legendary', 'mythic'].includes(result.item.rarity?.toLowerCase())) {
          triggerConfetti(result.item.rarity);
        }
        
        setTimeout(() => {
          setStage('result');
        }, 1000);
      }, 3000);
    } catch (error) {
      setStage('ready');
      onClose();
    }
  };

  const triggerConfetti = (rarity) => {
    const colors = {
      epic: ['#a855f7', '#9333ea', '#7e22ce'],
      legendary: ['#f59e0b', '#d97706', '#b45309'],
      mythic: ['#ef4444', '#dc2626', '#b91c1c'],
    };

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors[rarity.toLowerCase()] || ['#3b82f6'],
    });

    // Second burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors[rarity.toLowerCase()] || ['#3b82f6'],
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors[rarity.toLowerCase()] || ['#3b82f6'],
      });
    }, 400);
  };

  const getRarityGradient = (rarity) => {
    const gradients = {
      common: 'from-gray-600 to-gray-700',
      uncommon: 'from-green-600 to-green-700',
      rare: 'from-blue-600 to-blue-700',
      epic: 'from-purple-600 to-purple-700',
      legendary: 'from-yellow-600 to-yellow-700',
      mythic: 'from-red-600 to-red-700',
    };
    return gradients[rarity?.toLowerCase()] || gradients.common;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showClose={stage === 'ready' || stage === 'result'}>
      <div className="text-center py-8">
        <AnimatePresence mode="wait">
          {/* Ready Stage */}
          {stage === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-48 h-48 mx-auto bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center shadow-glow-lg"
              >
                <FiPackage className="w-24 h-24 text-white" />
              </motion.div>

              <div>
                <h2 className="text-3xl font-bold mb-2">{lootbox?.name}</h2>
                <p className="text-gray-400 mb-6">{lootbox?.description}</p>
                <div className="text-2xl font-bold text-primary-400 mb-8">
                  ${lootbox?.price.toFixed(2)}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleOpen}
                loading={opening}
                className="min-w-[200px]"
              >
                {t('lootbox.open')}
              </Button>
            </motion.div>
          )}

          {/* Spinning Stage */}
          {stage === 'spinning' && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <motion.div
                animate={{ 
                  rotateY: [0, 1800],
                  scale: [1, 1.2, 1, 1.2, 1]
                }}
                transition={{ 
                  duration: 3,
                  ease: "easeInOut"
                }}
                className="w-64 h-64 mx-auto bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center shadow-glow-xl"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FiPackage className="w-32 h-32 text-white" />
                </motion.div>
              </motion.div>

              <div className="text-2xl font-semibold animate-pulse">
                {t('lootbox.opening')}
              </div>
            </motion.div>
          )}

          {/* Revealing Stage */}
          {stage === 'revealing' && wonItem && (
            <motion.div
              key="revealing"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, ease: "backOut" }}
                className={`w-64 h-64 mx-auto bg-gradient-to-br ${getRarityGradient(wonItem.rarity)} rounded-2xl p-4 shadow-glow-xl border-4 border-white/20`}
              >
                <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden">
                  <img
                    src={wonItem.imageUrl || '/placeholder-item.png'}
                    alt={wonItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className={`badge badge-${wonItem.rarity?.toLowerCase()} text-lg px-4 py-2`}>
                  {wonItem.rarity}
                </span>
              </motion.div>
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
                  {t('lootbox.tryAgain')}
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.href = '/inventory'}
                >
                  {t('lootbox.goToInventory')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default LootBoxOpeningModal;
