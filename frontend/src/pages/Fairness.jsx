import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiShield, FiLock, FiEye, FiCheckCircle, FiCode } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import lootboxService from '@services/lootboxService';
import Button from '@components/common/Button';

const Fairness = () => {
  const { t } = useTranslation();
  const [openingId, setOpeningId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async () => {
    if (!openingId.trim()) {
      toast.error('Please enter an opening ID');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const result = await lootboxService.verifyFairness(openingId);
      setVerificationResult(result);
      
      if (result.verified) {
        toast.success('Opening verified as fair!');
      } else {
        toast.error('Verification failed!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        {/* Hero */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glow-lg"
          >
            <FiShield className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="page-header">Provably Fair System</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Complete transparency and verifiable randomness for every loot box opening
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How Our System Works</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="card p-8">
              <FiLock className="w-12 h-12 text-primary-400 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Cryptographic Security</h3>
              <p className="text-gray-400 mb-4">
                We use Node.js's crypto.randomInt() for generating truly random numbers. This is cryptographically secure and cannot be predicted or manipulated.
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-sm text-green-400">
                  const random = crypto.randomInt(1, totalWeight + 1);
                </code>
              </div>
            </div>

            <div className="card p-8">
              <FiEye className="w-12 h-12 text-primary-400 mb-4" />
              <h3 className="text-2xl font-bold mb-4">HMAC Verification</h3>
              <p className="text-gray-400 mb-4">
                Each opening generates an HMAC-SHA256 hash that proves the result was determined fairly and hasn't been tampered with.
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-sm text-green-400">
                  HMAC-SHA256(data + serverSeed)
                </code>
              </div>
            </div>
          </div>

          {/* Algorithm Steps */}
          <div className="card p-8">
            <h3 className="text-2xl font-bold mb-6">Algorithm Steps</h3>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Calculate Total Weight',
                  description: 'Sum all item weights (common: 50, rare: 10, legendary: 1, etc.)',
                },
                {
                  step: 2,
                  title: 'Generate Secure Random Number',
                  description: 'Use crypto.randomInt(1, totalWeight) for cryptographically secure randomness',
                },
                {
                  step: 3,
                  title: 'Select Winning Item',
                  description: 'Iterate through items and their cumulative weights to find the winner',
                },
                {
                  step: 4,
                  title: 'Generate Verification Hash',
                  description: 'Create HMAC-SHA256 hash of the result with server seed',
                },
                {
                  step: 5,
                  title: 'Store Immutable Log',
                  description: 'Save opening data in database for permanent verification',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Tool */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Verify an Opening</h2>
          
          <div className="card p-8 max-w-2xl mx-auto">
            <p className="text-gray-400 mb-6">
              Enter the opening ID from your history to verify it was provably fair:
            </p>

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={openingId}
                onChange={(e) => setOpeningId(e.target.value)}
                placeholder="Enter Opening ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                className="input flex-grow"
              />
              <Button
                variant="primary"
                onClick={handleVerify}
                loading={verifying}
              >
                Verify
              </Button>
            </div>

            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-lg ${
                  verificationResult.verified
                    ? 'bg-green-900/20 border-2 border-green-500'
                    : 'bg-red-900/20 border-2 border-red-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {verificationResult.verified ? (
                    <FiCheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <FiCode className="w-8 h-8 text-red-400" />
                  )}
                  <h3 className="text-2xl font-bold">
                    {verificationResult.verified ? 'Verified!' : 'Verification Failed'}
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Opening ID:</span>
                    <div className="font-mono bg-gray-900 p-2 rounded mt-1 break-all">
                      {verificationResult.openingId}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Item Won:</span>
                    <div className="font-semibold mt-1">{verificationResult.itemName}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Fairness Hash:</span>
                    <div className="font-mono bg-gray-900 p-2 rounded mt-1 break-all text-xs">
                      {verificationResult.fairnessHash}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Timestamp:</span>
                    <div className="mt-1">
                      {new Date(verificationResult.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Guarantees */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Our Guarantees</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FiShield,
                title: 'No Manipulation',
                description: 'Results are determined by cryptographically secure algorithms that cannot be manipulated by us or anyone else.',
              },
              {
                icon: FiLock,
                title: 'Immutable Logs',
                description: 'All openings are permanently logged in our database and cannot be altered after the fact.',
              },
              {
                icon: FiEye,
                title: 'Public Verification',
                description: 'Anyone can verify any opening at any time using our public verification tool.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center"
              >
                <item.icon className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fairness;
