require('dotenv').config()
const mongoose = require('mongoose')
const Sale = require('./backend/models/Sale')
const Expense = require('./backend/models/Expense')
const Product = require('./backend/models/Product')
const connectDatabase = require('./backend/config/database')

async function run() {
  await connectDatabase()
  console.log('--- DATABASE INSPECTION ---')
  
  const sales = await Sale.find({ status: { $ne: 'cancelled' } }).lean()
  console.log('Total non-cancelled Sales count:', sales.length)
  
  let totalSalesRevenue = 0
  let totalCOGS = 0
  let totalGrossProfit = 0
  let cashGrossProfit = 0
  let upiGrossProfit = 0
  let cardGrossProfit = 0
  let financeGrossProfit = 0

  sales.forEach((sale, sIdx) => {
    totalSalesRevenue += (sale.grandTotal || 0)
    let saleGrossProfit = 0
    let saleCOGS = 0
    sale.items.forEach((item, iIdx) => {
      const itemNetSelling = item.total !== undefined ? item.total : ((item.price * item.qty) - (item.discount || 0))
      const itemPurchasePrice = item.purchasePrice || 0
      const itemCost = itemPurchasePrice * item.qty
      const itemGross = itemNetSelling - itemCost
      saleCOGS += itemCost
      saleGrossProfit += itemGross
      console.log(` Sale #${sale.invoiceNumber} item #${iIdx+1}: name="${item.productName}", price=${item.price}, qty=${item.qty}, total=${item.total}, purchasePrice=${item.purchasePrice} => itemCost=${itemCost}, itemGross=${itemGross}`)
    })
    totalCOGS += saleCOGS
    totalGrossProfit += saleGrossProfit
    
    if (sale.paymentMode === 'cash') cashGrossProfit += saleGrossProfit
    else if (sale.paymentMode === 'upi') upiGrossProfit += saleGrossProfit
    else if (sale.paymentMode === 'card') cardGrossProfit += saleGrossProfit
    else if (sale.paymentMode === 'finance') financeGrossProfit += saleGrossProfit
  })

  const expenses = await Expense.find().lean()
  console.log('\nTotal Expenses count:', expenses.length)
  let totalExpenses = 0
  expenses.forEach(exp => {
    console.log(` Expense: category="${exp.category}", amount=${exp.amount}, date=${exp.date || exp.createdAt}`)
    totalExpenses += (exp.amount || 0)
  })

  const netProfit = totalGrossProfit - totalExpenses

  console.log('\n--- CALCULATED ACCOUNTING SUMMARY ---')
  console.log('Total Sales Revenue :', totalSalesRevenue)
  console.log('Total COGS          :', totalCOGS)
  console.log('Total Gross Profit  :', totalGrossProfit)
  console.log('Total Expenses      :', totalExpenses)
  console.log('Total Net Profit    :', netProfit)
  console.log('Gross Cash Profit   :', cashGrossProfit)
  console.log('Gross UPI Profit    :', upiGrossProfit)
  console.log('Gross Card Profit   :', cardGrossProfit)
  console.log('Gross Finance Profit:', financeGrossProfit)
  
  process.exit(0)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
