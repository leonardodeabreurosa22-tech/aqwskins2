import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiUser, FiSettings, FiClock, FiDollarSign, FiBox, FiGift, FiLock, FiGlobe } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import useAuthStore from '@store/authStore';
import userService from '@services/userService';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [preferencesForm, setPreferencesForm] = useState({
    language: i18n.language,
    currency: user?.preferredCurrency || 'USD',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [stats, txHistory, openHistory] = await Promise.all([
        userService.getStatistics(),
        userService.getTransactionHistory('all', 1, 10),
        userService.getOpeningHistory(1, 10),
      ]);
      setStatistics(stats);
      setTransactions(txHistory.transactions || []);
      setOpenings(openHistory.openings || []);
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await userService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await userService.updatePreferences(preferencesForm);
      i18n.changeLanguage(preferencesForm.language);
      updateUser({ preferredCurrency: preferencesForm.currency });
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400',
      mythic: 'text-red-400',
    };
    return colors[rarity?.toLowerCase()] || 'text-gray-400';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'transactions', label: 'Transactions', icon: FiDollarSign },
    { id: 'openings', label: 'Openings History', icon: FiBox },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-4xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{user?.username}</h1>
              <p className="text-gray-400 mb-4">{user?.email}</p>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="text-primary-400" />
                  <span className="font-semibold">{formatCurrency(user?.balance || 0, user?.preferredCurrency || 'USD')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-gray-400" />
                  <span className="text-sm text-gray-400">Joined {new Date(user?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiBox className="text-primary-400 text-2xl" />
                <h3 className="text-gray-400">Total Openings</h3>
              </div>
              <p className="text-3xl font-bold">{statistics.totalOpenings || 0}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiDollarSign className="text-green-400 text-2xl" />
                <h3 className="text-gray-400">Total Spent</h3>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(statistics.totalSpent || 0)}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiGift className="text-purple-400 text-2xl" />
                <h3 className="text-gray-400">Items Won</h3>
              </div>
              <p className="text-3xl font-bold">{statistics.itemsWon || 0}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiDollarSign className="text-yellow-400 text-2xl" />
                <h3 className="text-gray-400">Total Withdrawn</h3>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(statistics.totalWithdrawn || 0)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Username</label>
                    <p className="font-semibold">{user?.username}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="font-semibold">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Role</label>
                    <p className="font-semibold capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Preferred Currency</label>
                    <p className="font-semibold">{user?.preferredCurrency || 'USD'}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                {openings.length > 0 ? (
                  <div className="space-y-3">
                    {openings.slice(0, 5).map((opening) => (
                      <div key={opening.id} className="flex items-center justify-between py-2 border-b border-gray-700">
                        <div>
                          <p className={`font-semibold ${getRarityColor(opening.item?.rarity)}`}>
                            {opening.item?.name}
                          </p>
                          <p className="text-sm text-gray-400">{opening.lootbox?.name}</p>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(opening.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No recent activity</p>
                )}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="card p-6">
              <h3 className="text-xl font-bold mb-4">Transaction History</h3>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-4 capitalize">{tx.type}</td>
                          <td className="py-3 px-4">{formatCurrency(tx.amount, tx.currency)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No transactions yet</p>
              )}
            </div>
          )}

          {/* Openings History Tab */}
          {activeTab === 'openings' && (
            <div className="card p-6">
              <h3 className="text-xl font-bold mb-4">Loot Box Opening History</h3>
              {openings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openings.map((opening) => (
                    <div key={opening.id} className="card p-4 hover:border-primary-500 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <FiBox className="text-primary-400" />
                        <h4 className="font-semibold">{opening.lootbox?.name}</h4>
                      </div>
                      <div className="mb-3">
                        <p className={`font-bold ${getRarityColor(opening.item?.rarity)}`}>
                          {opening.item?.name}
                        </p>
                        <p className="text-sm text-gray-400 capitalize">{opening.item?.rarity}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formatDate(opening.createdAt)}</span>
                        <a 
                          href={`/fairness?opening=${opening.id}`}
                          className="text-primary-400 hover:text-primary-300"
                        >
                          Verify
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No openings yet</p>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Change Password */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FiLock className="text-primary-400 text-xl" />
                  <h3 className="text-xl font-bold">Change Password</h3>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="input"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" fullWidth>
                    Update Password
                  </Button>
                </form>
              </div>

              {/* Preferences */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FiGlobe className="text-primary-400 text-xl" />
                  <h3 className="text-xl font-bold">Preferences</h3>
                </div>
                <form onSubmit={handlePreferencesUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={preferencesForm.language}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, language: e.target.value })}
                      className="input"
                    >
                      <option value="en">English</option>
                      <option value="pt-BR">Português (BR)</option>
                      <option value="es">Español</option>
                      <option value="fil">Filipino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Currency</label>
                    <select
                      value={preferencesForm.currency}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, currency: e.target.value })}
                      className="input"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="BRL">BRL (R$)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="PHP">PHP (₱)</option>
                    </select>
                  </div>
                  <Button type="submit" variant="primary" fullWidth>
                    Save Preferences
                  </Button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
