import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import FarmerDashboardPage from './pages/FarmerDashboardPage';
import FarmerMyCropsPage from './pages/FarmerMyCropsPage';
import FarmerMyOrdersPage from './pages/FarmerMyOrdersPage';
import FarmerFarmBlogPage from './pages/FarmerFarmBlogPage';
import FarmerProfilePage from './pages/FarmerProfilePage';
import FarmerMessagesPage from './pages/FarmerMessagesPage';
import FarmerSettingsPage from './pages/FarmerSettingsPage';
import MarketplacePage from './pages/MarketplacePage';
import ContactPage from './pages/ContactPage';




import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminFarmerManagementPage from './pages/admin/AdminFarmerManagementPage';
import AdminVerificationPage from './pages/admin/AdminVerificationPage';
import AdminBuyersPage from './pages/admin/AdminBuyersPage';
import AdminCropsPage from './pages/admin/AdminCropsPage';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><LandingPage /></Layout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

          {/* Admin login - separate from main login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin dashboard (admin only) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin - Farmer Management */}
          <Route
            path="/admin/farmers"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminFarmerManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Admin - Verification Requests */}
          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminVerificationPage />
              </ProtectedRoute>
            }
          />

          {/* Admin - Buyer Management */}
          <Route
            path="/admin/buyers"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminBuyersPage />
              </ProtectedRoute>
            }
          />

          {/* Admin - Crop Listings */}
          <Route
            path="/admin/crops"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCropsPage />
              </ProtectedRoute>
            }
          />


          {/* Marketplace - Protected, buyers only */}


          <Route
            path="/marketplace"
            element={
              <ProtectedRoute requiredRole="buyer">
                <MarketplacePage />
              </ProtectedRoute>
            }
          />
          {/* Farmer Dashboard - Protected, farmers only */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="farmer">
                <DashboardLayout>
                  <FarmerDashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Farmer - My Crops */}
          <Route
            path="/dashboard/crops"
            element={
              <ProtectedRoute requiredRole="farmer">
                <DashboardLayout>
                  <FarmerMyCropsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Farmer - My Orders */}
          <Route
            path="/dashboard/orders"
            element={
              <ProtectedRoute requiredRole="farmer">
                <DashboardLayout>
                  <FarmerMyOrdersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Farmer - Farm Blog */}
          <Route
            path="/dashboard/blog"
            element={
              <ProtectedRoute requiredRole="farmer">
                <DashboardLayout>
                  <FarmerFarmBlogPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Farmer - Messages */}
          <Route
            path="/dashboard/messages"
            element={
              <ProtectedRoute requiredRole="farmer">
                <DashboardLayout>
                  <FarmerMessagesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Farmer - Profile */}
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute requiredRole="farmer">
                <DashboardLayout>
                  <FarmerProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Farmer - Settings */}
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute requiredRole="farmer">
                <DashboardLayout>
                  <FarmerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

        </Routes>


      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

