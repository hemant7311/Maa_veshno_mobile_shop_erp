import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/layout/Layout'
import AgentLayout from '../components/layout/AgentLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import NotFound from '../pages/NotFound'

// Lazy-load pages
const Home = React.lazy(() => import('../pages/Home'))
const WholesaleHome = React.lazy(() => import('../pages/storefront/WholesaleHome'))
const AboutUs = React.lazy(() => import('../pages/AboutUs'))
const ContactUs = React.lazy(() => import('../pages/ContactUs'))
const AllProductsList = React.lazy(() => import('../pages/AllProductsList'))
const TermsConditions = React.lazy(() => import('../pages/TermsConditions'))
const PrivacyPolicy = React.lazy(() => import('../pages/PrivacyPolicy'))
const RefundPolicy = React.lazy(() => import('../pages/RefundPolicy'))
const TrackEmi = React.lazy(() => import('../pages/customer/TrackEmi'))

const Categories = React.lazy(() => import('../pages/inventory/Categories'))
const Products = React.lazy(() => import('../pages/inventory/Products'))
const Purchases = React.lazy(() => import('../pages/inventory/Purchases'))
const AddProduct = React.lazy(() => import('../pages/inventory/AddProduct'))
const CompanyReturns = React.lazy(() => import('../pages/inventory/CompanyReturns'))
const ImeiManagement = React.lazy(() => import('../pages/imei/ImeiManagement'))
const Customers = React.lazy(() => import('../pages/customers/Customers'))
const Sliders = React.lazy(() => import('../pages/settings/Sliders'))
const Buyers = React.lazy(() => import('../pages/buyers/Buyers'))
const Suppliers = React.lazy(() => import('../pages/suppliers/Suppliers'))
const CustomerBilling = React.lazy(() => import('../pages/billing/CustomerBilling'))
const BuyerBilling = React.lazy(() => import('../pages/billing/BuyerBilling'))
const Finance = React.lazy(() => import('../pages/finance/Finance'))
const BalanceSheet = React.lazy(() => import('../pages/finance/BalanceSheet'))
const Loans = React.lazy(() => import('../pages/finance/Loans'))
const CustomerReceivables = React.lazy(() => import('../pages/finance/CustomerReceivables'))
const Reports = React.lazy(() => import('../pages/reports/Reports'))
const Settings = React.lazy(() => import('../pages/settings/Settings'))
const Backup = React.lazy(() => import('../pages/settings/Backup'))
const Users = React.lazy(() => import('../pages/settings/Users'))

// Agent pages
const AgentPanel = React.lazy(() => import('../pages/agent/AgentPanel'))

const Fallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
    <div className="spinner" />
  </div>
)

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <React.Suspense fallback={<Fallback />}>
          <Routes>
            {/* Public Consumer Portal Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/all-products" element={<AllProductsList />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/track-emi/:phone" element={<TrackEmi />} />

            {/* Wholesaler Storefront Route */}
            <Route
              path="/store"
              element={
                <ProtectedRoute>
                  <WholesaleHome />
                </ProtectedRoute>
              }
            />

            {/* Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected ERP Dashboard & Admin/Staff Routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute requiredPermission="categories"><Categories /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute requiredPermission="products"><Products /></ProtectedRoute>} />
              <Route path="/products/add" element={<ProtectedRoute requiredPermission="products"><AddProduct /></ProtectedRoute>} />
              <Route path="/products/:id/edit" element={<ProtectedRoute requiredPermission="products"><AddProduct /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute requiredPermission="suppliers"><Purchases /></ProtectedRoute>} />
              <Route path="/company-returns" element={<ProtectedRoute requiredPermission="suppliers"><CompanyReturns /></ProtectedRoute>} />
              <Route path="/imei" element={<ProtectedRoute requiredPermission="imeis"><ImeiManagement /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute requiredPermission="customers"><Customers /></ProtectedRoute>} />
              <Route path="/buyers" element={<ProtectedRoute requiredPermission="customers"><Buyers /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute requiredPermission="suppliers"><Suppliers /></ProtectedRoute>} />

              <Route path="/billing" element={<Navigate to="/billing/customer" replace />} />
              <Route path="/billing/customer" element={<ProtectedRoute requiredPermission="billing"><CustomerBilling /></ProtectedRoute>} />
              <Route path="/billing/buyer" element={<ProtectedRoute requiredPermission="billing"><BuyerBilling /></ProtectedRoute>} />

              <Route path="/finance" element={<ProtectedRoute requiredPermission="finance"><Finance /></ProtectedRoute>} />
              <Route path="/balance-sheet" element={<ProtectedRoute requiredPermission="finance"><BalanceSheet /></ProtectedRoute>} />
              <Route path="/loans" element={<ProtectedRoute requiredPermission="finance"><Loans /></ProtectedRoute>} />
              <Route path="/customer-receivables" element={<ProtectedRoute requiredPermission="finance"><CustomerReceivables /></ProtectedRoute>} />

              <Route path="/reports" element={<ProtectedRoute requiredPermission="reports"><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requiredPermission="settings"><Settings /></ProtectedRoute>} />

              {/* Strict Admin Only Routes */}
              <Route path="/sliders" element={<ProtectedRoute requiredAdmin={true}><Sliders /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requiredAdmin={true}><Users /></ProtectedRoute>} />
              <Route path="/backup" element={<ProtectedRoute requiredAdmin={true}><Backup /></ProtectedRoute>} />
            </Route>

            {/* Protected Agent Portal Routes (Finance Agents Only) */}
            <Route element={<ProtectedRoute><AgentLayout /></ProtectedRoute>}>
              <Route path="/agent-panel" element={<AgentPanel />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRouter
