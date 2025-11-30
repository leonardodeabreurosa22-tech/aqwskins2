import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiGithub, FiTwitter, FiInstagram, FiMail } from 'react-icons/fi';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AQ</span>
              </div>
              <span className="text-xl font-bold gradient-text">AQW Skins</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <FiGithub size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <FiTwitter size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <FiInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/lootboxes" className="text-gray-400 hover:text-white transition text-sm">
                  {t('nav.lootboxes')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-400 hover:text-white transition text-sm">
                  {t('nav.howItWorks')}
                </Link>
              </li>
              <li>
                <Link to="/fairness" className="text-gray-400 hover:text-white transition text-sm">
                  {t('nav.fairness')}
                </Link>
              </li>
              <li>
                <Link to="/exchanger" className="text-gray-400 hover:text-white transition text-sm">
                  {t('nav.exchanger')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="text-gray-400 hover:text-white transition text-sm">
                  {t('footer.helpCenter')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition text-sm">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition text-sm">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@aqw-skins.com"
                  className="text-gray-400 hover:text-white transition text-sm flex items-center space-x-1"
                >
                  <FiMail size={14} />
                  <span>{t('footer.contact')}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">
                {t('footer.ageRestriction')}
              </li>
              <li className="text-gray-400 text-sm">
                {t('footer.responsibleGaming')}
              </li>
              <li className="text-gray-400 text-sm">
                {t('footer.provablyFair')}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm">
            © {currentYear} AQW Skins. {t('footer.rights')}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>🔒 SSL Secured</span>
            <span>✓ PCI DSS Compliant</span>
            <span>✓ Provably Fair</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
