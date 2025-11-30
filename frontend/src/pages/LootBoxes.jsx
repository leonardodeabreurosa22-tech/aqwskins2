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

        {/* Flex-wrap layout matching test file structure */}
        <div className="flex flex-wrap justify-center items-stretch w-full">
          {lootboxes.map((box) => (
            <Link key={box.id} to={`/lootbox/${box.id}`} className="m-2">
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                className="card-hover h-full w-[157px] lg:w-[210px] bg-gradient-to-b from-transparent to-gray-700/80 border border-gray-600 rounded-md shadow-inner"
                style={{ boxShadow: 'inset 0 0 75px rgba(13, 35, 69, 1)' }}
              >
                <div className="aspect-video bg-gradient-to-br from-primary-600 to-secondary-600 rounded-t-md flex items-center justify-center">
                  <FiBox className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                </div>
                <div className="p-3 lg:p-4">
                  <h3 className="text-sm lg:text-base font-bold mb-1 truncate">{box.name}</h3>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{box.description}</p>
                  <div className="flex flex-col gap-1">
                    <span className="text-base lg:text-lg font-bold text-primary-400">
                      ${parseFloat(box.price || 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
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
