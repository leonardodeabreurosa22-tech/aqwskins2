import { useState, useRef, useEffect } from 'react';
import useUIStore from '@store/uiStore';
import { FiDollarSign, FiChevronDown } from 'react-icons/fi';

const currencies = [
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'PHP', symbol: '₱', flag: '🇵🇭' },
];

const CurrencySelector = () => {
  const { currency, setCurrency } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentCurrency = currencies.find((curr) => curr.code === currency) || currencies[0];

  const handleCurrencyChange = (code) => {
    setCurrency(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition"
      >
        <FiDollarSign size={18} />
        <span className="text-sm font-medium">{currentCurrency.code}</span>
        <FiChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-gray-700 rounded-lg shadow-lg py-2 z-10">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => handleCurrencyChange(curr.code)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition flex items-center justify-between ${
                curr.code === currency ? 'bg-gray-600' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{curr.flag}</span>
                <span className="text-sm font-medium">{curr.code}</span>
              </div>
              <span className="text-xs text-gray-400">{curr.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
