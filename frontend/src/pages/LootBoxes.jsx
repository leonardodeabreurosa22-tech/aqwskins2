import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiBox } from 'react-icons/fi';
import lootboxService from '@services/lootboxService';
import Loading from '@components/common/Loading';

const LootBoxes = () => {
  const { t } = useTranslation();
  const [lootboxes, setLootboxes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLootBoxes();
  }, []);

  const loadLootBoxes = async () => {
    try {
      const response = await lootboxService.getAll();
      setLootboxes(response?.data?.lootboxes || []);
    } catch (error) {
      console.error('Failed to load loot boxes:', error);
      setLootboxes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <h1 className="page-header">{t('lootbox.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lootboxes.map((box) => (
            <Link key={box.id} to={`/lootbox/${box.id}`}>
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                className="card-hover"
              >
                <div className="aspect-video bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                  <FiBox className="w-24 h-24 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{box.name}</h3>
                  <p className="text-gray-400 mb-4 line-clamp-2">{box.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-400">
                      ${parseFloat(box.price || 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {box.openCount || 0} opened
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LootBoxes;
