import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiPackage, FiFilter, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import inventoryService from '@services/inventoryService';
import userService from '@services/userService';
import ItemCard from '@components/common/ItemCard';
import Loading from '@components/common/Loading';
import Button from '@components/common/Button';
import Modal from '@components/common/Modal';
import useAuthStore from '@store/authStore';

const Inventory = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showSellModal, setShowSellModal] = useState(false);
  const [itemToSell, setItemToSell] = useState(null);
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [selectedRarity, sortBy]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [inventoryData, statsData] = await Promise.all([
        inventoryService.getInventory(1, 50, {
          rarity: selectedRarity !== 'all' ? selectedRarity : undefined,
          sort: sortBy,
        }),
        inventoryService.getStats(),
      ]);
      setInventory(inventoryData.items);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (item) => {
    try {
      await inventoryService.requestWithdrawal(item.id);
      toast.success('Withdrawal requested successfully!');
      loadInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request withdrawal');
    }
  };

  const openSellModal = (item) => {
    setItemToSell(item);
    setShowSellModal(true);
  };

  const handleSellItem = async () => {
    if (!itemToSell) return;

    setSelling(true);
    try {
      const result = await userService.sellItemForCredits(itemToSell.id);
      toast.success(`Item sold for $${result.creditAmount.toFixed(2)}!`);
      updateUser({ balance: result.newBalance });
      setShowSellModal(false);
      setItemToSell(null);
      loadInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sell item');
    } finally {
      setSelling(false);
    }
  };

  const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

  if (loading && !inventory.length) return <Loading fullScreen />;

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="page-header">{t('inventory.title')}</h1>
          {stats && (
            <div className="text-right">
              <div className="text-sm text-gray-400">{t('inventory.totalValue')}</div>
              <div className="text-2xl font-bold text-primary-400">
                ${stats.totalValue?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-gray-500">
                {stats.itemCount || 0} {t('inventory.itemCount')}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="card p-4 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <FiFilter />
            <span className="text-sm font-medium">{t('inventory.filterByRarity')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {rarities.map((rarity) => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedRarity === rarity
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <span className="text-sm font-medium">{t('inventory.sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <option value="newest">{t('inventory.sortNewest')}</option>
              <option value="value">{t('inventory.sortValue')}</option>
              <option value="rarity">{t('inventory.sortRarity')}</option>
            </select>
          </div>
        </div>

        {/* Inventory Grid */}
        {inventory.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {inventory.map((item) => (
              <div key={item.id} className="relative group">
                <ItemCard item={item.item} showPrice showRarity />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-90 transition-all flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100 p-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleWithdraw(item)}
                    fullWidth
                  >
                    {t('inventory.withdraw')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSellModal(item)}
                    fullWidth
                  >
                    <FiDollarSign className="inline mr-1" />
                    Sell for ${item.item?.value?.toFixed(2) || '0.00'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FiPackage className="w-24 h-24 mx-auto text-gray-700 mb-4" />
            <h3 className="text-2xl font-bold mb-2">{t('inventory.empty')}</h3>
            <p className="text-gray-400 mb-6">{t('inventory.emptyDescription')}</p>
            <Button variant="primary" onClick={() => (window.location.href = '/lootboxes')}>
              {t('nav.lootboxes')}
            </Button>
          </motion.div>
        )}

        {/* Sell Item Modal */}
        <Modal
          isOpen={showSellModal}
          onClose={() => !selling && setShowSellModal(false)}
          title="Sell Item for Credits"
        >
          {itemToSell && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                <img
                  src={itemToSell.item?.imageUrl || '/placeholder-item.png'}
                  alt={itemToSell.item?.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{itemToSell.item?.name}</h3>
                  <p className="text-sm text-gray-400 capitalize">{itemToSell.item?.rarity}</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">You will receive:</p>
                <p className="text-3xl font-bold text-primary-400">
                  ${itemToSell.item?.value?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Credits will be added to your account balance
                </p>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <p className="text-sm text-yellow-400">
                  ⚠️ This action cannot be undone. The item will be removed from your inventory.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSellModal(false)}
                  variant="outline"
                  fullWidth
                  disabled={selling}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSellItem}
                  variant="primary"
                  fullWidth
                  loading={selling}
                >
                  Confirm Sale
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Inventory;
