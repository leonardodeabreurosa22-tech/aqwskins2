import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiBox, FiShield, FiZap, FiGlobe, FiTrendingUp } from 'react-icons/fi';
import lootboxService from '@services/lootboxService';
import ItemCard from '@components/common/ItemCard';
import Loading from '@components/common/Loading';

const Home = () => {
  const { t } = useTranslation();
  const [lootboxes, setLootboxes] = useState([]);
  const [liveDrops, setLiveDrops] = useState([]);
  const [stats, setStats] = useState({ users: 15420, opened: 245680, items: 1250 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load lootboxes (required)
      const boxesResponse = await lootboxService.getAll();
      const boxes = boxesResponse?.data?.lootboxes || [];
      setLootboxes(boxes.slice(0, 3));
      
      // Load live drops (optional - may fail if backend not deployed yet)
      try {
        const dropsResponse = await lootboxService.getLiveDrops(10);
        setLiveDrops(dropsResponse?.data?.drops || []);
      } catch (dropsError) {
        console.warn('Live drops not available yet:', dropsError);
        setLiveDrops([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setLootboxes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              {t('home.hero.subtitle')}
            </p>
            <Link to="/lootboxes" className="btn btn-primary btn-lg">
              {t('home.hero.cta')}
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          >
            {[
              { icon: FiTrendingUp, value: stats.users.toLocaleString(), label: t('home.hero.stats.users') },
              { icon: FiBox, value: stats.opened.toLocaleString(), label: t('home.hero.stats.opened') },
              { icon: FiZap, value: stats.items.toLocaleString(), label: t('home.hero.stats.items') },
            ].map((stat, index) => (
              <div key={index} className="card p-6 text-center">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-primary-400" />
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gray-900">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
            {t('home.features.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FiShield,
                title: t('home.features.provablyFair.title'),
                description: t('home.features.provablyFair.description'),
              },
              {
                icon: FiZap,
                title: t('home.features.instantDelivery.title'),
                description: t('home.features.instantDelivery.description'),
              },
              {
                icon: FiBox,
                title: t('home.features.securePayments.title'),
                description: t('home.features.securePayments.description'),
              },
              {
                icon: FiGlobe,
                title: t('home.features.multiCurrency.title'),
                description: t('home.features.multiCurrency.description'),
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center hover:shadow-glow-md transition-all"
              >
                <feature.icon className="w-16 h-16 mx-auto mb-4 text-primary-400" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Loot Boxes */}
      <section className="section bg-gray-800">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold gradient-text">Featured Loot Boxes</h2>
            <Link to="/lootboxes" className="btn btn-outline">
              View All
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : (
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
                      <p className="text-gray-400 mb-4">{box.description}</p>
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
          )}
        </div>
      </section>

      {/* Live Drops */}
      <section className="section bg-gray-900">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-4 gradient-text">
            {t('home.liveDrops.title')}
          </h2>
          <p className="text-center text-gray-400 mb-12">
            {t('home.liveDrops.subtitle')}
          </p>

          {liveDrops.length > 0 ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {liveDrops.map((drop, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-4 flex items-center space-x-4"
                >
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                    <img
                      src={drop.item?.imageUrl || '/placeholder-item.png'}
                      alt={drop.item?.name}
                      className="w-12 h-12 object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{drop.username}</span>
                      <span className="text-gray-400">unboxed</span>
                      <span className={`badge badge-${drop.item?.rarity?.toLowerCase()}`}>
                        {drop.item?.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      ${drop.item?.value?.toFixed(2)} · {drop.lootboxName}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(drop.timestamp).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No recent drops</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
