import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from '@components/layout/Layout';
import PrivateRoute from '@components/auth/PrivateRoute';
import AdminRoute from '@components/auth/AdminRoute';
import Loading from '@components/common/Loading';

// Lazy load pages
const Home = lazy(() => import('@pages/Home'));
const LootBoxes = lazy(() => import('@pages/LootBoxes'));
const LootBoxDetail = lazy(() => import('@pages/LootBoxDetail'));
const Inventory = lazy(() => import('@pages/Inventory'));
const Exchanger = lazy(() => import('@pages/Exchanger'));
const Deposit = lazy(() => import('@pages/Deposit'));
const Profile = lazy(() => import('@pages/Profile'));
const HowItWorks = lazy(() => import('@pages/HowItWorks'));
const Login = lazy(() => import('@pages/Login'));
const Register = lazy(() => import('@pages/Register'));
const Support = lazy(() => import('@pages/Support'));
const Fairness = lazy(() => import('@pages/Fairness'));
const AdminDashboard = lazy(() => import('@pages/admin/Dashboard'));
const NotFound = lazy(() => import('@pages/NotFound'));

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '0.75rem',
            padding: '1rem',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Suspense fallback={<Loading fullScreen />}>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/lootboxes" element={<LootBoxes />} />
            <Route path="/lootbox/:id" element={<LootBoxDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/fairness" element={<Fairness />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/exchanger" element={<Exchanger />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support" element={<Support />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
