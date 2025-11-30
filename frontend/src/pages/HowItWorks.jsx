import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiBox, FiShield, FiGift, FiRepeat, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: FiDollarSign,
      title: 'Deposit Funds',
      description: 'Add funds to your account using credit card, PayPal, or PIX (Brazil). We support USD, BRL, EUR, and PHP.',
      step: 1,
    },
    {
      icon: FiBox,
      title: 'Choose a Loot Box',
      description: 'Browse our selection of loot boxes containing exclusive Adventure Quest Worlds items. Each box shows all possible items and their drop rates.',
      step: 2,
    },
    {
      icon: FiGift,
      title: 'Open & Win',
      description: 'Click to open your loot box! Our provably fair algorithm ensures every opening is completely random and verifiable.',
      step: 3,
    },
    {
      icon: FiCheckCircle,
      title: 'Receive Your Item',
      description: 'Get your item code instantly! Redeem it in Adventure Quest Worlds or trade it with other users in our exchanger.',
      step: 4,
    },
  ];

  const features = [
    {
      icon: FiShield,
      title: 'Provably Fair System',
      description: 'Every loot box opening uses cryptographic algorithms that can be publicly verified. We use HMAC-SHA256 to ensure complete transparency and fairness.',
      details: [
        'Cryptographically secure random number generation',
        'HMAC-based result verification',
        'Public verification tools',
        'Immutable opening logs',
      ],
    },
    {
      icon: FiRepeat,
      title: 'Item Exchange',
      description: 'Don\'t want an item? Trade it! Our exchanger lets you swap items you don\'t need for ones you want.',
      details: [
        'Trade multiple items for one',
        'Automatic value calculation',
        'Fair 5% exchange fee',
        'Instant transactions',
      ],
    },
    {
      icon: FiDollarSign,
      title: 'Instant Withdrawals',
      description: 'Get your item codes immediately after opening. No waiting, no delays.',
      details: [
        'Automatic code delivery',
        'Manual fallback if stock depleted',
        'Deposit requirements for coupon items',
        '3-day SLA for manual processing',
      ],
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="page-header">How It Works</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Learn how our provably fair loot box system works and start collecting rare AQW items today!
          </p>
        </div>

        {/* Steps */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center relative"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {step.step}
                </div>
                <step.icon className="w-16 h-16 mx-auto mb-4 mt-4 text-primary-400" />
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="card p-8"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-400 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-gray-300">
                          <FiCheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                q: 'How do I know the loot box system is fair?',
                a: 'Every opening uses cryptographically secure random numbers and can be verified using our public verification tool. We use HMAC-SHA256 to generate a hash that proves the result was determined fairly.',
              },
              {
                q: 'Can I get my money back if I don\'t like what I won?',
                a: 'All loot box openings are final. However, you can use our exchanger to trade unwanted items for others you prefer.',
              },
              {
                q: 'How long does it take to receive my item code?',
                a: 'Most items are delivered instantly. If an item is out of stock, it will be manually processed within 3 business days.',
              },
              {
                q: 'What currencies do you accept?',
                a: 'We support USD, BRL (Brazilian Real), EUR, and PHP (Philippine Peso) with automatic conversion.',
              },
              {
                q: 'Are there any fees?',
                a: 'Deposits are free. The exchanger charges a 5% fee on the total value of items being traded.',
              },
              {
                q: 'Can I use influencer coupon codes?',
                a: 'Yes! Enter a valid coupon code to receive a free loot box opening. Note that items won with coupons require a minimum deposit before withdrawal.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <h3 className="text-lg font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 p-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl mb-8 opacity-90">
            Open your first loot box and discover amazing AQW items!
          </p>
          <a href="/lootboxes" className="btn btn-secondary btn-lg">
            Browse Loot Boxes
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default HowItWorks;
