import axios from 'axios'
import { API_V1_URL } from '../config/env'

const api = axios.create({
  baseURL: API_V1_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('erp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('erp_token')
      sessionStorage.removeItem('erp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/* ============ LOANS API ============ */
export const getAllLoans = () => api.get('/loans')
export const getLoanById = (id) => api.get(`/loans/${id}`)
export const createLoan = (data) => api.post('/loans', data)
export const updateLoan = (id, data) => api.put(`/loans/${id}`, data)
export const deleteLoan = (id) => api.delete(`/loans/${id}`)
export const cancelLoan = (id, reason) => api.put(`/loans/${id}/cancel`, { reason })
export const addLoanPayment = (loanId, data) => api.post(`/loans/${loanId}/payments`, data)
export const getLoanPayments = (loanId) => api.get(`/loans/${loanId}/payments`)
export const getLoanSummary = () => api.get('/loans/summary')

/* ============ CUSTOMER RECEIVABLES API ============ */
export const getAllCustomerReceivables = () => api.get('/customer-receivables')
export const getCustomerReceivableById = (id) => api.get(`/customer-receivables/${id}`)
export const createCustomerReceivable = (data) => api.post('/customer-receivables', data)
export const updateCustomerReceivable = (id, data) => api.put(`/customer-receivables/${id}`, data)
export const deleteCustomerReceivable = (id) => api.delete(`/customer-receivables/${id}`)
export const cancelCustomerReceivable = (id) => api.put(`/customer-receivables/${id}/cancel`)
export const giveMoney = (receivableId, data) => api.post(`/customer-receivables/${receivableId}/give`, data)
export const receiveMoney = (receivableId, data) => api.post(`/customer-receivables/${receivableId}/receive`, data)
export const getCustomerReceivablePayments = (receivableId) => api.get(`/customer-receivables/${receivableId}/payments`)
export const getCustomerReceivableSummary = () => api.get('/customer-receivables/summary')

/* ============ COMPANY RETURNS API ============ */
export const getAllCompanyReturns = (params) => api.get('/company-returns', { params })
export const getCompanyReturnById = (id) => api.get(`/company-returns/${id}`)
export const createCompanyReturn = (data) => api.post('/company-returns', data)
export const deleteCompanyReturn = (id) => api.delete(`/company-returns/${id}`)
export const getCompanyReturnsBySupplier = (supplierId) => api.get(`/company-returns/supplier/${supplierId}`)
export const exportCompanyReturnsData = (params) => api.get('/company-returns/export', { params })
export const exportMobileReturnsData = (params) => api.get('/company-returns/export-mobile', { params })

/* ============ SALES / BILLS API ============ */
export const getAllSales = (params) => api.get('/sales', { params })
export const getSaleById = (id) => api.get(`/sales/${id}`)
export const createSale = (data) => api.post('/sales', data)
export const updateSale = (id, data) => api.put(`/sales/${id}`, data)
export const cancelSale = (id) => api.patch(`/sales/${id}/cancel`)
export const getSalesByCustomer = (customerIdOrPhone) => api.get(`/sales?customer=${customerIdOrPhone}`)
export const getBalanceSheet = () => api.get('/sales/balance-sheet')
export const getPendingEmiNotifications = () => api.get('/sales/notifications/emi')

/* ============ PRODUCTS / IMEI API ============ */
export const getAllProducts = (params) => api.get('/products', { params })
export const getProductById = (id) => api.get(`/products/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const getAllImeis = (params) => api.get('/imeis', { params })
export const getImeiById = (id) => api.get(`/imeis/${id}`)
export const createImei = (data) => api.post('/imeis', data)
export const updateImei = (id, data) => api.patch(`/imeis/${id}`, data)
export const deleteImei = (id) => api.delete(`/imeis/${id}`)
export const getAvailableImeisByProduct = (productId) => api.get(`/imeis?productId=${productId}&status=available`)

/* ============ CUSTOMERS / BUYERS API ============ */
export const getAllCustomers = (params) => api.get('/customers', { params })
export const getCustomerById = (id) => api.get(`/customers/${id}`)
export const createCustomer = (data) => api.post('/customers', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)
export const getCustomerBills = (customerId) => api.get(`/sales?customerId=${customerId}`)

/* ============ SUPPLIERS API ============ */
export const getAllSuppliers = (params) => api.get('/suppliers', { params })
export const getSupplierById = (id) => api.get(`/suppliers/${id}`)
export const createSupplier = (data) => api.post('/suppliers', data)
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data)
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`)

/* ============ PURCHASES API ============ */
export const getAllPurchases = (params) => api.get('/purchases', { params })
export const getPurchaseById = (id) => api.get(`/purchases/${id}`)
export const createPurchase = (data) => api.post('/purchases', data)
export const updatePurchase = (id, data) => api.put(`/purchases/${id}`, data)
export const deletePurchase = (id) => api.delete(`/purchases/${id}`)

/* ============ TRANSACTIONS API ============ */
export const getAllTransactions = (params) => api.get('/transactions', { params })
export const getTransactionSummary = (params) => api.get('/transactions/summary', { params })

/* ============ REPORTS API ============ */
export const getReportsData = (params) => api.get('/reports', { params })
export const getDashboardData = () => api.get('/dashboard')

/* ============ EXPORTS API ============ */
export const exportProducts = (params) => api.get('/exports/products', { params, responseType: 'blob' })
export const exportCustomers = (params) => api.get('/exports/customers', { params, responseType: 'blob' })
export const exportSuppliers = (params) => api.get('/exports/suppliers', { params, responseType: 'blob' })
export const exportSales = (params) => api.get('/exports/sales', { params, responseType: 'blob' })
export const exportPurchases = (params) => api.get('/exports/purchases', { params, responseType: 'blob' })
export const exportStock = (params) => api.get('/exports/stock', { params, responseType: 'blob' })
export const exportFinance = (params) => api.get('/exports/finance', { params, responseType: 'blob' })
export const exportEmi = (params) => api.get('/exports/emi', { params, responseType: 'blob' })
export const exportLoans = (params) => api.get('/exports/loans', { params, responseType: 'blob' })
export const exportCustomerReceivablesData = (params) => api.get('/exports/customer-receivables', { params, responseType: 'blob' })
export const exportCompanyReturns = (params) => api.get('/exports/company-returns', { params, responseType: 'blob' })
export const exportCompanyReturnsByMobile = (params) => api.get('/exports/company-returns/mobile', { params, responseType: 'blob' })
export const getFullBackup = () => api.get('/exports/full-backup')

/* ============ EXPENSES API ============ */
export const getAllExpenses = (params) => api.get('/expenses', { params })
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)

export const downloadBlob = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default api
