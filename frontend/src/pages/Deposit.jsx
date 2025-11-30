import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiCreditCard, FiDollarSign, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { SiStripe, SiPaypal } from 'react-icons/si';
import { toast } from 'react-hot-toast';
import depositService from '@services/depositService';
import useAuthStore from '@store/authStore';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';

const Deposit = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [selectedCurrency, setSelectedCurrency] = useState(user?.preferredCurrency || 'USD');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [conversionPreview, setConversionPreview] = useState(null);
  const [pixQRCode, setPixQRCode] = useState(null);
  const [showPixModal, setShowPixModal] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'PHP', symbol: '₱', flag: '🇵🇭' },
  ];

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: SiStripe,
      description: 'Visa, Mastercard, American Express',
      available: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: SiPaypal,
      description: 'Pay with your PayPal account',
      available: true,
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: FiDollarSign,
      description: 'Instant payment (Brazil only)',
      available: selectedCurrency === 'BRL',
    },
  ];

  const quickAmounts = {
    USD: [10, 25, 50, 100, 250, 500],
    BRL: [50, 100, 250, 500, 1000, 2500],
    EUR: [10, 25, 50, 100, 250, 500],
    PHP: [500, 1000, 2500, 5000, 10000, 25000],
  };

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      loadConversionPreview();
    } else {
      setConversionPreview(null);
    }
  }, [amount, selectedCurrency]);

  const loadConversionPreview = async () => {
    try {
      const result = await depositService.getConversionRate(
        selectedCurrency,
        'USD',
        parseFloat(amount)
      );
      setConversionPreview(result);
    } catch (error) {
      console.error('Failed to load conversion:', error);
    }
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (depositAmount < 5) {
      toast.error('Minimum deposit is $5 or equivalent');
      return;
    }

    setLoading(true);
    try {
      if (selectedMethod === 'stripe') {
        const { sessionUrl } = await depositService.createStripeSession(
          depositAmount,
          selectedCurrency
        );
        window.location.href = sessionUrl;
      } else if (selectedMethod === 'paypal') {
        const { approvalUrl } = await depositService.createPayPalOrder(
          depositAmount,
          selectedCurrency
        );
        window.location.href = approvalUrl;
      } else if (selectedMethod === 'pix') {
        const pixData = await depositService.generatePixQRCode(depositAmount);
        setPixQRCode(pixData);
        setShowPixModal(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (code) => {
    return currencies.find((c) => c.code === code)?.symbol || '$';
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="page-header">Add Funds</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Deposit funds to start opening loot boxes
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="card p-8 mb-8">
            {/* Current Balance */}
            <div className="text-center mb-8 p-6 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Current Balance</p>
              <p className="text-4xl font-bold">
                {getCurrencySymbol(selectedCurrency)}
                {user?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>

            {/* Currency Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Select Currency</label>
              <div className="grid grid-cols-4 gap-3">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => setSelectedCurrency(currency.code)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCurrency === currency.code
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{currency.flag}</div>
                    <div className="font-bold">{currency.code}</div>
                    <div className="text-sm text-gray-400">{currency.symbol}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">
                  {getCurrencySymbol(selectedCurrency)}
                </span>
                <input
                  type="number"
                  min="5"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input pl-12 text-2xl font-bold"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Quick Select</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {quickAmounts[selectedCurrency]?.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickAmount(value)}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold"
                  >
                    {getCurrencySymbol(selectedCurrency)}
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversion Preview */}
            {conversionPreview && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {amount} {selectedCurrency} =
                  </span>
                  <span className="text-lg font-bold text-blue-400">
                    ${conversionPreview.usdAmount?.toFixed(2)} USD
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Exchange rate: 1 {selectedCurrency} = ${conversionPreview.rate?.toFixed(4)} USD
                </p>
              </motion.div>
            )}

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Payment Method</label>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => method.available && setSelectedMethod(method.id)}
                      disabled={!method.available}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedMethod === method.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : method.available
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon className="w-8 h-8" />
                        <div className="flex-1">
                          <div className="font-bold">{method.name}</div>
                          <div className="text-sm text-gray-400">{method.description}</div>
                        </div>
                        {selectedMethod === method.id && (
                          <FiCheck className="w-6 h-6 text-primary-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deposit Info */}
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex gap-2">
                <FiAlertCircle className="text-yellow-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-yellow-400 mb-1">Important Information</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Minimum deposit: $5 or equivalent</li>
                    <li>• Credits are added instantly after payment confirmation</li>
                    <li>• All transactions are secure and encrypted</li>
                    <li>• Processing time varies by payment method (instant to 24h)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Deposit Button */}
            <Button
              onClick={handleDeposit}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!amount || parseFloat(amount) < 5}
            >
              <FiCreditCard className="inline mr-2" />
              Deposit {amount ? `${getCurrencySymbol(selectedCurrency)}${amount}` : 'Funds'}
            </Button>
          </div>

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <FiCheck className="text-green-400" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="text-green-400" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="text-green-400" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>

        {/* PIX Modal */}
        {showPixModal && pixQRCode && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold mb-4 text-center">PIX Payment</h3>
              
              <div className="bg-white p-4 rounded-lg mb-4">
                <img
                  src={pixQRCode.qrCodeUrl}
                  alt="PIX QR Code"
                  className="w-full max-w-xs mx-auto"
                />
              </div>

              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">PIX Code (Copy & Paste)</p>
                <p className="text-sm font-mono break-all">{pixQRCode.pixCode}</p>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(pixQRCode.pixCode);
                    toast.success('PIX code copied!');
                  }}
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="mt-2"
                >
                  Copy Code
                </Button>
              </div>

              <div className="text-sm text-gray-400 mb-6">
                <p className="mb-2">Amount: R$ {pixQRCode.amount?.toFixed(2)}</p>
                <p className="text-xs">
                  Scan the QR code with your banking app or copy the PIX code. Payment will be
                  confirmed within a few minutes.
                </p>
              </div>

              <Button onClick={() => setShowPixModal(false)} variant="primary" fullWidth>
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposit;
