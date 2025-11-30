import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiBox } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import lootboxService from '@services/lootboxService';
import useAuthStore from '@store/authStore';
import Loading from '@components/common/Loading';
import Button from '@components/common/Button';
import ItemCard from '@components/common/ItemCard';
import LootBoxOpeningModal from '@components/lootbox/LootBoxOpeningModal';

const LootBoxDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const [lootbox, setLootbox] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);

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
      toast.error('Please login to open loot boxes');
      return;
    }

    if (!user || user.balance < lootbox.price) {
      toast.error(t('lootbox.insufficientBalance'));
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
      toast.error(error.response?.data?.message || 'Failed to open loot box');
      throw error;
    } finally {
      setOpening(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!lootbox) return <div>Loot box not found</div>;

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Loot Box Info */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="aspect-square bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                <FiBox className="w-32 h-32 text-white" />
              </div>
              <div className="p-6">
                <h1 className="text-3xl font-bold mb-2">{lootbox.name}</h1>
                <p className="text-gray-400 mb-6">{lootbox.description}</p>
                
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-400 mb-1">{t('lootbox.price')}</div>
                  <div className="text-3xl font-bold text-primary-400">
                    ${parseFloat(lootbox.price || 0).toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleOpenClick}
                  disabled={!isAuthenticated || !user || (user?.balance || 0) < (lootbox?.price || 0)}
                >
                  {t('lootbox.open')}
                </Button>

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