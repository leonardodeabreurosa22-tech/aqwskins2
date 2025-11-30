import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '@store/authStore';
import useUIStore from '@store/uiStore';
import { FiMenu, FiX, FiUser, FiLogOut, FiGlobe, FiDollarSign } from 'react-icons/fi';
import LanguageSelector from '@components/common/LanguageSelector';
import CurrencySelector from '@components/common/CurrencySelector';

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openModal } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleDeposit = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      openModal('deposit');
    }
  };

  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">AQ</span>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              AQW Skins
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/lootboxes" className="text-gray-300 hover:text-white transition">
              {t('nav.lootboxes')}
            </Link>
            <Link to="/how-it-works" className="text-gray-300 hover:text-white transition">
              {t('nav.howItWorks')}
            </Link>
            <Link to="/fairness" className="text-gray-300 hover:text-white transition">
              {t('nav.fairness')}
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/inventory" className="text-gray-300 hover:text-white transition">
                  {t('nav.inventory')}
                </Link>
                <Link to="/exchanger" className="text-gray-300 hover:text-white transition">
                  {t('nav.exchanger')}
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <CurrencySelector />

            {isAuthenticated ? (
              <>
                <button
                  onClick={handleDeposit}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <FiDollarSign />
                  <span>{t('nav.deposit')}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
                  >
                    <FiUser />
                    <span className="text-sm font-medium">{user?.username}</span>
                    <span className="text-xs text-primary-400">
                      ${parseFloat(user?.balance || 0).toFixed(2)}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm hover:bg-gray-600 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.profile')}
                      </Link>
                      <Link
                        to="/support"
                        className="block px-4 py-2 text-sm hover:bg-gray-600 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.support')}
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm hover:bg-gray-600 transition text-yellow-400"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t('nav.admin')}
                        </Link>
                      )}
                      <hr className="my-2 border-gray-600" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-600 transition flex items-center space-x-2 text-red-400"
                      >
                        <FiLogOut />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link
              to="/lootboxes"
              className="block py-2 text-gray-300 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.lootboxes')}
            </Link>
            <Link
              to="/how-it-works"
              className="block py-2 text-gray-300 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.howItWorks')}
            </Link>
            <Link
              to="/fairness"
              className="block py-2 text-gray-300 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.fairness')}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/inventory"
                  className="block py-2 text-gray-300 hover:text-white transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.inventory')}
                </Link>
                <Link
                  to="/exchanger"
                  className="block py-2 text-gray-300 hover:text-white transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.exchanger')}
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-300 hover:text-white transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={handleDeposit}
                  className="w-full btn btn-primary mt-4"
                >
                  {t('nav.deposit')}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full btn btn-secondary mt-2"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-4">
                <Link
                  to="/login"
                  className="block btn btn-outline w-full text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="block btn btn-primary w-full text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
