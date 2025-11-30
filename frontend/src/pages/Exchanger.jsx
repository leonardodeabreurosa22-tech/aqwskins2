import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiSearch, FiX, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import exchangerService from '@services/exchangerService';
import inventoryService from '@services/inventoryService';
import ItemCard from '@components/common/ItemCard';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import Modal from '@components/common/Modal';

const Exchanger = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedSourceItems, setSelectedSourceItems] = useState([]);
  const [targetItem, setTargetItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [calculation, setCalculation] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inventory, available] = await Promise.all([
        inventoryService.getInventory(),
        exchangerService.getAvailableItems(),
      ]);
      setInventoryItems(inventory.items || []);
      setAvailableItems(available.items || []);
    } catch (error) {
      toast.error('Failed to load exchanger data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSourceItem = (item) => {
    setSelectedSourceItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
    setCalculation(null);
  };

  const selectTargetItem = (item) => {
    setTargetItem(item);
    setCalculation(null);
  };

  const handleCalculate = async () => {
    if (selectedSourceItems.length === 0) {
      toast.error('Select at least one item to exchange');
      return;
    }
    if (!targetItem) {
      toast.error('Select a target item');
      return;
    }

    try {
      const sourceIds = selectedSourceItems.map((item) => item.id);
      const result = await exchangerService.calculateExchange(sourceIds, targetItem.id);
      setCalculation(result);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to calculate exchange');
    }
  };

  const handleExchange = async () => {
    setExchanging(true);
    try {
      const sourceIds = selectedSourceItems.map((item) => item.id);
      await exchangerService.executeExchange(sourceIds, targetItem.id);
      toast.success('Exchange completed successfully!');
      setShowConfirmModal(false);
      setSelectedSourceItems([]);
      setTargetItem(null);
      setCalculation(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Exchange failed');
    } finally {
      setExchanging(false);
    }
  };

  const getTotalValue = () => {
    return selectedSourceItems.reduce((sum, item) => sum + (item.value || 0), 0);
  };

  const filteredAvailableItems = availableItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="page-header">Item Exchanger</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Exchange your items for other items. Fee: 5%
          </p>
        </div>

        {/* Exchange Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Source Items (Your Inventory) */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Your Items</h2>
              <p className="text-sm text-gray-400 mb-4">
                Select items to exchange ({selectedSourceItems.length} selected)
              </p>
              
              {inventoryItems.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {inventoryItems.map((item) => {
                    const isSelected = selectedSourceItems.some((i) => i.id === item.id);
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className={`relative cursor-pointer p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => toggleSourceItem(item)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                            <FiCheck className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || '/placeholder-item.png'}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{item.name}</p>
                            <p className="text-sm text-gray-400 capitalize">{item.rarity}</p>
                            <p className="text-sm text-primary-400">${item.value?.toFixed(2)}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No items in inventory</p>
              )}

              {selectedSourceItems.length > 0 && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Total Value:</span>
                    <span className="font-bold text-lg">${getTotalValue().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <FiArrowRight className="w-12 h-12 text-primary-400" />
          </div>

          {/* Target Item */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Target Item</h2>
              
              {/* Search and Filters */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="mythic">Mythic</option>
                </select>
              </div>

              {targetItem && (
                <div className="mb-4 p-4 border-2 border-primary-500 bg-primary-500/10 rounded-lg relative">
                  <button
                    onClick={() => setTargetItem(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  >
                    <FiX />
                  </button>
                  <div className="flex items-center gap-3">
                    <img
                      src={targetItem.imageUrl || '/placeholder-item.png'}
                      alt={targetItem.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div>
                      <p className="font-bold">{targetItem.name}</p>
                      <p className="text-sm text-gray-400 capitalize">{targetItem.rarity}</p>
                      <p className="text-primary-400 font-semibold">${targetItem.value?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Items List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredAvailableItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                      targetItem?.id === item.id
                        ? 'border-primary-500'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => selectTargetItem(item)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || '/placeholder-item.png'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{item.rarity}</p>
                        <p className="text-sm text-primary-400">${item.value?.toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredAvailableItems.length === 0 && (
                <p className="text-gray-400 text-center py-8">No items found</p>
              )}
            </div>
          </div>
        </div>

        {/* Calculation and Exchange */}
        <div className="card p-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-6 text-center">Exchange Summary</h3>
          
          {calculation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Your Items Value</p>
                  <p className="text-2xl font-bold">${calculation.sourceValue?.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Target Item Value</p>
                  <p className="text-2xl font-bold">${calculation.targetValue?.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertCircle className="text-yellow-400" />
                  <p className="font-semibold">Exchange Fee (5%)</p>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  ${calculation.fee?.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Final Value After Fee</p>
                <p className="text-3xl font-bold">${calculation.finalValue?.toFixed(2)}</p>
              </div>

              {calculation.canExchange ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-center font-semibold">
                    ✓ Exchange is possible! You have enough value.
                  </p>
                  {calculation.refund > 0 && (
                    <p className="text-sm text-gray-400 text-center mt-2">
                      Refund to balance: ${calculation.refund?.toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-center font-semibold">
                    ✗ Insufficient value. You need ${calculation.shortage?.toFixed(2)} more.
                  </p>
                </div>
              )}

              {calculation.canExchange && (
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  variant="primary"
                  fullWidth
                  size="lg"
                >
                  Confirm Exchange
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                Select items from your inventory and a target item, then click calculate
              </p>
              <Button
                onClick={handleCalculate}
                variant="primary"
                disabled={selectedSourceItems.length === 0 || !targetItem}
              >
                Calculate Exchange
              </Button>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Exchange"
        >
          <div className="space-y-4">
            <p className="text-gray-400">
              Are you sure you want to exchange {selectedSourceItems.length} item(s) for{' '}
              <span className="text-white font-bold">{targetItem?.name}</span>?
            </p>

            {calculation?.refund > 0 && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                <p className="text-sm text-green-400">
                  ${calculation.refund.toFixed(2)} will be added to your balance
                </p>
              </div>
            )}

            <p className="text-sm text-yellow-400">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                fullWidth
                disabled={exchanging}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExchange}
                variant="primary"
                fullWidth
                loading={exchanging}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Exchanger;
