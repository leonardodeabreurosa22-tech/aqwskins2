import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiMail, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Button from '@components/common/Button';
import useAuthStore from '@store/authStore';

const Support = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to submit a support ticket');
      return;
    }

    setSubmitting(true);
    try {
      // Submit ticket logic here
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Support ticket submitted successfully!');
      setFormData({ subject: '', category: 'general', priority: 'medium', message: '' });
    } catch (error) {
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="page-header">Support Center</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Need help? We're here for you 24/7!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Methods */}
          <div className="card p-6 text-center">
            <FiMail className="w-12 h-12 mx-auto mb-4 text-primary-400" />
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-gray-400 mb-4">Get help via email</p>
            <a
              href="mailto:support@aqw-skins.com"
              className="text-primary-400 hover:text-primary-300"
            >
              support@aqw-skins.com
            </a>
          </div>

          <div className="card p-6 text-center">
            <FiMessageSquare className="w-12 h-12 mx-auto mb-4 text-primary-400" />
            <h3 className="text-xl font-bold mb-2">Live Chat</h3>
            <p className="text-gray-400 mb-4">Chat with our team</p>
            <button className="btn btn-primary">Start Chat</button>
          </div>

          <div className="card p-6 text-center">
            <FiAlertCircle className="w-12 h-12 mx-auto mb-4 text-primary-400" />
            <h3 className="text-xl font-bold mb-2">Submit Ticket</h3>
            <p className="text-gray-400 mb-4">Create a support ticket</p>
            <a href="#ticket-form" className="btn btn-outline">
              Create Ticket
            </a>
          </div>
        </div>

        {/* Ticket Form */}
        <div id="ticket-form" className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Submit a Ticket</h2>

            {!isAuthenticated ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Please login to submit a support ticket</p>
                <a href="/login" className="btn btn-primary">
                  Login
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-700"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="withdrawal">Withdrawal Issue</option>
                    <option value="fairness">Fairness Concern</option>
                    <option value="account">Account Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="input resize-none"
                    placeholder="Please provide as much detail as possible..."
                    required
                  />
                </div>

                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  Submit Ticket
                </Button>
              </form>
            )}
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                q: 'How long does it take to get a response?',
                a: 'We typically respond within 24 hours. Urgent issues are prioritized and may receive faster responses.',
              },
              {
                q: 'What information should I include in my ticket?',
                a: 'Please include: your account email, transaction IDs (if applicable), screenshots of errors, and detailed steps to reproduce the issue.',
              },
              {
                q: 'Can I check the status of my ticket?',
                a: 'Yes! Go to your profile and click on "My Tickets" to view all your support tickets and their current status.',
              },
              {
                q: 'What if my issue is urgent?',
                a: 'For urgent issues affecting your account or payments, select "Urgent" priority when creating your ticket. You can also use our live chat for immediate assistance.',
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
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
