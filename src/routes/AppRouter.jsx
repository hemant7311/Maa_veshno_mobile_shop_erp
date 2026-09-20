import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/layout/Layout'
import AgentLayout from '../components/layout/AgentLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import NotFound from '../pages/NotFound'

// Lazy-load pages (will add as built)
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

            <Route path="/store" element={<WholesaleHome />} />

          {/* Admin Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Dashboard Routes (Admins Only) */}
            <Route element={<ProtectedRoute requireAdmin={true}><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/products/add" element={<AddProduct />} />
              <Route path="/products/:id/edit" element={<AddProduct />} />
              <Route path="/company-returns" element={<CompanyReturns />} />
              <Route path="/imei" element={<ImeiManagement />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/buyers" element={<Buyers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/billing/customer" element={<CustomerBilling />} />
              <Route path="/billing/buyer" element={<BuyerBilling />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/balance-sheet" element={<BalanceSheet />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/customer-receivables" element={<CustomerReceivables />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/sliders" element={<Sliders />} />
              <Route path="/users" element={<Users />} />
              <Route path="/backup" element={<Backup />} />
            </Route>

            {/* Protected Agent Portal Routes (Agents Only) */}
            <Route element={<ProtectedRoute requireAgent={true}><AgentLayout /></ProtectedRoute>}>
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


