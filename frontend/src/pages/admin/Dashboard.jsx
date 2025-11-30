import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiBox,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
  FiGift,
  FiSettings,
  FiFileText,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import adminService from '@services/adminService';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import Modal from '@components/common/Modal';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [lootboxes, setLootboxes] = useState([]);
  const [items, setItems] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Modals
  const [showLootBoxModal, setShowLootBoxModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [editingLootBox, setEditingLootBox] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  // Forms
  const [lootBoxForm, setLootBoxForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    active: true,
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    rarity: 'common',
    value: '',
    imageUrl: '',
    category: '',
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  });

  const [withdrawalCode, setWithdrawalCode] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);

      if (activeTab === 'users') {
        const usersData = await adminService.getUsers();
        setUsers(usersData.users || []);
      } else if (activeTab === 'lootboxes') {
        const lootboxData = await adminService.getLootBoxes();
        setLootboxes(lootboxData.lootboxes || []);
      } else if (activeTab === 'items') {
        const itemsData = await adminService.getItems();
        setItems(itemsData.items || []);
      } else if (activeTab === 'withdrawals') {
        const withdrawalsData = await adminService.getPendingWithdrawals();
        setWithdrawals(withdrawalsData.withdrawals || []);
      } else if (activeTab === 'coupons') {
        const couponsData = await adminService.getCoupons();
        setCoupons(couponsData.coupons || []);
      } else if (activeTab === 'logs') {
        const logsData = await adminService.getAuditLogs();
        setAuditLogs(logsData.logs || []);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await adminService.banUser(userId, 'Banned by admin');
      toast.success('User banned successfully');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleCreateLootBox = async (e) => {
    e.preventDefault();
    try {
      if (editingLootBox) {
        await adminService.updateLootBox(editingLootBox.id, lootBoxForm);
        toast.success('Loot box updated successfully');
      } else {
        await adminService.createLootBox(lootBoxForm);
        toast.success('Loot box created successfully');
      }
      setShowLootBoxModal(false);
      setEditingLootBox(null);
      setLootBoxForm({ name: '', description: '', price: '', imageUrl: '', active: true });
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to save loot box');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await adminService.updateItem(editingItem.id, itemForm);
        toast.success('Item updated successfully');
      } else {
        await adminService.createItem(itemForm);
        toast.success('Item created successfully');
      }
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({ name: '', description: '', rarity: 'common', value: '', imageUrl: '', category: '' });
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCoupon(couponForm);
      toast.success('Coupon created successfully');
      setShowCouponModal(false);
      setCouponForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '' });
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to create coupon');
    }
  };

  const handleApproveWithdrawal = async () => {
    if (!withdrawalCode) {
      toast.error('Please enter item code');
      return;
    }
    try {
      await adminService.approveWithdrawal(selectedWithdrawal.id, withdrawalCode);
      toast.success('Withdrawal approved');
      setShowWithdrawalModal(false);
      setSelectedWithdrawal(null);
      setWithdrawalCode('');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiTrendingUp },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'lootboxes', label: 'Loot Boxes', icon: FiBox },
    { id: 'items', label: 'Items', icon: FiPackage },
    { id: 'withdrawals', label: 'Withdrawals', icon: FiDollarSign },
    { id: 'coupons', label: 'Coupons', icon: FiGift },
    { id: 'logs', label: 'Audit Logs', icon: FiFileText },
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <h1 className="page-header mb-8">Admin Dashboard</h1>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiUsers className="text-primary-400 text-2xl" />
                <h3 className="text-gray-400">Total Users</h3>
              </div>
              <p className="text-3xl font-bold">{stats.totalUsers || 0}</p>
              <p className="text-sm text-green-400 mt-1">
                +{stats.newUsersToday || 0} today
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiDollarSign className="text-green-400 text-2xl" />
                <h3 className="text-gray-400">Total Revenue</h3>
              </div>
              <p className="text-3xl font-bold">${stats.totalRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-500 mt-1">
                ${stats.revenueToday?.toFixed(2) || '0.00'} today
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiBox className="text-purple-400 text-2xl" />
                <h3 className="text-gray-400">Box Openings</h3>
              </div>
              <p className="text-3xl font-bold">{stats.totalOpenings || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.openingsToday || 0} today
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiAlertCircle className="text-yellow-400 text-2xl" />
                <h3 className="text-gray-400">Pending Withdrawals</h3>
              </div>
              <p className="text-3xl font-bold">{stats.pendingWithdrawals || 0}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
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
        >
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Username</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Balance</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800">
                        <td className="py-3 px-4">{user.username}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">${user.balance?.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user.isBanned ? (
                            <span className="text-red-400">Banned</span>
                          ) : (
                            <span className="text-green-400">Active</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBanUser(user.id)}
                          >
                            {user.isBanned ? 'Unban' : 'Ban'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Loot Boxes Tab */}
          {activeTab === 'lootboxes' && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Loot Box Management</h2>
                <Button onClick={() => setShowLootBoxModal(true)}>
                  <FiPlus className="inline mr-2" />
                  Add Loot Box
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lootboxes.map((box) => (
                  <div key={box.id} className="card p-4">
                    <img
                      src={box.imageUrl || '/placeholder.png'}
                      alt={box.name}
                      className="w-full h-40 object-cover rounded mb-3"
                    />
                    <h3 className="font-bold mb-2">{box.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{box.description}</p>
                    <p className="text-primary-400 font-bold mb-3">${box.price}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingLootBox(box);
                          setLootBoxForm(box);
                          setShowLootBoxModal(true);
                        }}
                      >
                        <FiEdit />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (confirm('Delete this loot box?')) {
                            await adminService.deleteLootBox(box.id);
                            loadDashboardData();
                          }
                        }}
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Item Management</h2>
                <Button onClick={() => setShowItemModal(true)}>
                  <FiPlus className="inline mr-2" />
                  Add Item
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="card p-3">
                    <img
                      src={item.imageUrl || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <p className="font-bold text-sm mb-1">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize mb-1">{item.rarity}</p>
                    <p className="text-primary-400 text-sm font-bold mb-2">${item.value}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingItem(item);
                          setItemForm(item);
                          setShowItemModal(true);
                        }}
                      >
                        <FiEdit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (confirm('Delete this item?')) {
                            await adminService.deleteItem(item.id);
                            loadDashboardData();
                          }
                        }}
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">Pending Withdrawals</h2>
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-4 border border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{withdrawal.user?.username}</p>
                        <p className="text-sm text-gray-400">{withdrawal.item?.name}</p>
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(withdrawal.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowWithdrawalModal(true);
                          }}
                        >
                          <FiCheck className="inline mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await adminService.rejectWithdrawal(withdrawal.id, 'Rejected by admin');
                            loadDashboardData();
                          }}
                        >
                          <FiX className="inline mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {withdrawals.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No pending withdrawals</p>
                )}
              </div>
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Coupon Management</h2>
                <Button onClick={() => setShowCouponModal(true)}>
                  <FiPlus className="inline mr-2" />
                  Create Coupon
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Code</th>
                      <th className="text-left py-3 px-4">Discount</th>
                      <th className="text-left py-3 px-4">Uses</th>
                      <th className="text-left py-3 px-4">Expires</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-gray-800">
                        <td className="py-3 px-4 font-mono">{coupon.code}</td>
                        <td className="py-3 px-4">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}%`
                            : `$${coupon.discountValue}`}
                        </td>
                        <td className="py-3 px-4">
                          {coupon.currentUses}/{coupon.maxUses || '∞'}
                        </td>
                        <td className="py-3 px-4">
                          {coupon.expiresAt
                            ? new Date(coupon.expiresAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          {coupon.isActive ? (
                            <span className="text-green-400">Active</span>
                          ) : (
                            <span className="text-red-400">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'logs' && (
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-800 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">{log.user?.username}</span>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="text-gray-400">{log.action}</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                        {log.ipAddress}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Loot Box Modal */}
        <Modal
          isOpen={showLootBoxModal}
          onClose={() => {
            setShowLootBoxModal(false);
            setEditingLootBox(null);
          }}
          title={editingLootBox ? 'Edit Loot Box' : 'Create Loot Box'}
        >
          <form onSubmit={handleCreateLootBox} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={lootBoxForm.name}
                onChange={(e) => setLootBoxForm({ ...lootBoxForm, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={lootBoxForm.description}
                onChange={(e) => setLootBoxForm({ ...lootBoxForm, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={lootBoxForm.price}
                onChange={(e) => setLootBoxForm({ ...lootBoxForm, price: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="url"
                value={lootBoxForm.imageUrl}
                onChange={(e) => setLootBoxForm({ ...lootBoxForm, imageUrl: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" fullWidth onClick={() => setShowLootBoxModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                {editingLootBox ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Item Modal */}
        <Modal
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          title={editingItem ? 'Edit Item' : 'Create Item'}
        >
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rarity</label>
              <select
                value={itemForm.rarity}
                onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value })}
                className="input"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="mythic">Mythic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Value ($)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.value}
                onChange={(e) => setItemForm({ ...itemForm, value: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="url"
                value={itemForm.imageUrl}
                onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" fullWidth onClick={() => setShowItemModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Coupon Modal */}
        <Modal
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          title="Create Coupon"
        >
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Code</label>
              <input
                type="text"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="input font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Discount Type</label>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="input"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Discount Value</label>
              <input
                type="number"
                step="0.01"
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Uses</label>
              <input
                type="number"
                value={couponForm.maxUses}
                onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                className="input"
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expires At</label>
              <input
                type="datetime-local"
                value={couponForm.expiresAt}
                onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" fullWidth onClick={() => setShowCouponModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                Create
              </Button>
            </div>
          </form>
        </Modal>

        {/* Withdrawal Approval Modal */}
        <Modal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          title="Approve Withdrawal"
        >
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400 mb-1">User</p>
                <p className="font-bold">{selectedWithdrawal.user?.username}</p>
              </div>
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400 mb-1">Item</p>
                <p className="font-bold">{selectedWithdrawal.item?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Item Code</label>
                <input
                  type="text"
                  value={withdrawalCode}
                  onChange={(e) => setWithdrawalCode(e.target.value)}
                  className="input font-mono"
                  placeholder="Enter activation code"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setShowWithdrawalModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={handleApproveWithdrawal}>
                  Approve & Send Code
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard;
