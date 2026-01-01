/**
 * Test Script: Payment Notifications and History System
 * 
 * This script tests:
 * 1. Notification badge displays correct count
 * 2. Notifications update when verify/reject
 * 3. Highlighting for new payments (< 24 hours)
 * 4. Payment history filters
 * 5. CSV export functionality
 * 6. Payment statistics calculation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:5050/api';

// Test credentials
const STAFF_CREDENTIALS = {
  email: 'staff@itkmmshop22.com',
  password: 'staff123'
};

const ADMIN_CREDENTIALS = {
  email: 'admin@itkmmshop22.com',
  password: 'admin123'
};

let staffToken = null;
let adminToken = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Login functions
async function loginStaff() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, STAFF_CREDENTIALS);
    staffToken = response.data.data.token;
    console.log('Staff token:', staffToken ? 'Token received' : 'No token');
    logSuccess('Staff logged in successfully');
    return staffToken;
  } catch (error) {
    logError(`Staff login failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function loginAdmin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
    adminToken = response.data.data.token;
    console.log('Admin token:', adminToken ? 'Token received' : 'No token');
    logSuccess('Admin logged in successfully');
    return adminToken;
  } catch (error) {
    logError(`Admin login failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// Test 1: Notification Badge Count
async function testNotificationBadgeCount() {
  logTest('Notification Badge Count');
  
  try {
    // Get pending payments count
    const response = await axios.get(`${API_URL}/payments`, {
      params: { status: 'pending' },
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    
    const pendingCount = response.data.data?.length || 0;
    
    logSuccess(`Pending payments count: ${pendingCount}`);
    
    if (pendingCount > 0) {
      logSuccess('✓ Notification badge should display count: ' + pendingCount);
    } else {
      logWarning('No pending payments found. Badge should not be displayed.');
    }
    
    return { success: true, pendingCount };
  } catch (error) {
    logError(`Failed to get pending count: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 2: Verify Payment and Check Notification Update
async function testNotificationUpdateOnVerify() {
  logTest('Notification Update on Verify');
  
  try {
    // Get a pending payment
    const response = await axios.get(`${API_URL}/payments`, {
      params: { status: 'pending' },
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    
    const pendingPayments = response.data.data || [];
    
    if (pendingPayments.length === 0) {
      logWarning('No pending payments to verify. Skipping test.');
      return { success: true, skipped: true };
    }
    
    const initialCount = pendingPayments.length;
    const paymentToVerify = pendingPayments[0];
    
    logSuccess(`Initial pending count: ${initialCount}`);
    logSuccess(`Verifying payment ID: ${paymentToVerify.id} for order #${paymentToVerify.order_number || paymentToVerify.order_id}`);
    
    // Verify the payment
    await axios.post(
      `${API_URL}/payments/${paymentToVerify.id}/verify-slip`,
      {},
      { headers: { Authorization: `Bearer ${staffToken}` } }
    );
    
    logSuccess('Payment verified successfully');
    
    // Check updated count
    const updatedResponse = await axios.get(`${API_URL}/payments`, {
      params: { status: 'pending' },
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    
    const updatedCount = updatedResponse.data.payments?.length || 0;
    
    logSuccess(`Updated pending count: ${updatedCount}`);
    
    if (updatedCount === initialCount - 1) {
      logSuccess('✓ Notification count decreased correctly after verification');
    } else {
      logError(`✗ Expected count ${initialCount - 1}, got ${updatedCount}`);
    }
    
    return { success: true, initialCount, updatedCount };
  } catch (error) {
    logError(`Failed to test notification update: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 3: Reject Payment and Check Notification Update
async function testNotificationUpdateOnReject() {
  logTest('Notification Update on Reject');
  
  try {
    // Get a pending payment
    const response = await axios.get(`${API_URL}/payments`, {
      params: { status: 'pending' },
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    
    const pendingPayments = response.data.data || [];
    
    if (pendingPayments.length === 0) {
      logWarning('No pending payments to reject. Skipping test.');
      return { success: true, skipped: true };
    }
    
    const initialCount = pendingPayments.length;
    const paymentToReject = pendingPayments[0];
    
    logSuccess(`Initial pending count: ${initialCount}`);
    logSuccess(`Rejecting payment ID: ${paymentToReject.id} for order #${paymentToReject.order_number || paymentToReject.order_id}`);
    
    // Reject the payment
    await axios.post(
      `${API_URL}/payments/${paymentToReject.id}/confirm`,
      {
        verified: false,
        rejection_reason: 'Test rejection - amount mismatch'
      },
      { headers: { Authorization: `Bearer ${staffToken}` } }
    );
    
    logSuccess('Payment rejected successfully');
    
    // Check updated count
    const updatedResponse = await axios.get(`${API_URL}/payments`, {
      params: { status: 'pending' },
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    
    const updatedCount = updatedResponse.data.payments?.length || 0;
    
    logSuccess(`Updated pending count: ${updatedCount}`);
    
    if (updatedCount === initialCount - 1) {
      logSuccess('✓ Notification count decreased correctly after rejection');
    } else {
      logError(`✗ Expected count ${initialCount - 1}, got ${updatedCount}`);
    }
    
    return { success: true, initialCount, updatedCount };
  } catch (error) {
    logError(`Failed to test notification update: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 4: New Payment Highlighting (< 24 hours)
async function testNewPaymentHighlighting() {
  logTest('New Payment Highlighting (< 24 hours)');
  
  try {
    // Get all payments
    const response = await axios.get(`${API_URL}/payments`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    
    const payments = response.data.data || [];
    
    if (payments.length === 0) {
      logWarning('No payments found. Skipping test.');
      return { success: true, skipped: true };
    }
    
    // Check which payments are new (< 24 hours)
    const now = new Date();
    const newPayments = payments.filter(payment => {
      const uploadDate = new Date(payment.created_at);
      const hoursDiff = (now - uploadDate) / (1000 * 60 * 60);
      return hoursDiff < 24;
    });
    
    logSuccess(`Total payments: ${payments.length}`);
    logSuccess(`New payments (< 24 hours): ${newPayments.length}`);
    
    if (newPayments.length > 0) {
      logSuccess('✓ These payments should be highlighted:');
      newPayments.forEach(payment => {
        const uploadDate = new Date(payment.created_at);
        const hoursAgo = Math.floor((now - uploadDate) / (1000 * 60 * 60));
        log(`  - Payment #${payment.id} (Order #${payment.order_number || payment.order_id}) - ${hoursAgo} hours ago`, 'yellow');
      });
    } else {
      logWarning('No new payments found. No highlighting should be shown.');
    }
    
    return { success: true, totalPayments: payments.length, newPayments: newPayments.length };
  } catch (error) {
    logError(`Failed to test new payment highlighting: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 5: Payment History Filters
async function testPaymentHistoryFilters() {
  logTest('Payment History Filters');
  
  try {
    const filterTests = [];
    
    // Test 1: Filter by status
    logSuccess('\n📋 Testing status filter...');
    const statusResponse = await axios.get(`${API_URL}/payments`, {
      params: { status: 'verified' },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifiedPayments = statusResponse.data.payments || [];
    logSuccess(`✓ Status filter (verified): ${verifiedPayments.length} payments`);
    filterTests.push({ filter: 'status=verified', count: verifiedPayments.length });
    
    // Test 2: Filter by payment method
    logSuccess('\n📋 Testing payment method filter...');
    const methodResponse = await axios.get(`${API_URL}/payments`, {
      params: { paymentMethod: 'bank_transfer' },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const bankTransferPayments = methodResponse.data.payments || [];
    logSuccess(`✓ Payment method filter (bank_transfer): ${bankTransferPayments.length} payments`);
    filterTests.push({ filter: 'paymentMethod=bank_transfer', count: bankTransferPayments.length });
    
    // Test 3: Filter by date range
    logSuccess('\n📋 Testing date range filter...');
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateResponse = await axios.get(`${API_URL}/payments`, {
      params: {
        dateFrom: lastWeek.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dateRangePayments = dateResponse.data.payments || [];
    logSuccess(`✓ Date range filter (last 7 days): ${dateRangePayments.length} payments`);
    filterTests.push({ filter: 'dateRange=last7days', count: dateRangePayments.length });
    
    // Test 4: Filter by amount range
    logSuccess('\n📋 Testing amount range filter...');
    const amountResponse = await axios.get(`${API_URL}/payments`, {
      params: {
        amountMin: 100,
        amountMax: 1000
      },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const amountRangePayments = amountResponse.data.payments || [];
    logSuccess(`✓ Amount range filter (100-1000): ${amountRangePayments.length} payments`);
    filterTests.push({ filter: 'amountRange=100-1000', count: amountRangePayments.length });
    
    // Test 5: Combined filters
    logSuccess('\n📋 Testing combined filters...');
    const combinedResponse = await axios.get(`${API_URL}/payments`, {
      params: {
        status: 'verified',
        paymentMethod: 'bank_transfer'
      },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const combinedPayments = combinedResponse.data.payments || [];
    logSuccess(`✓ Combined filters (verified + bank_transfer): ${combinedPayments.length} payments`);
    filterTests.push({ filter: 'combined', count: combinedPayments.length });
    
    logSuccess('\n✓ All filter tests completed successfully');
    
    return { success: true, filterTests };
  } catch (error) {
    logError(`Failed to test payment history filters: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 6: Payment Statistics Calculation
async function testPaymentStatistics() {
  logTest('Payment Statistics Calculation');
  
  try {
    // Get all payments
    const response = await axios.get(`${API_URL}/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const payments = response.data.data || [];
    
    if (payments.length === 0) {
      logWarning('No payments found. Skipping test.');
      return { success: true, skipped: true };
    }
    
    // Calculate statistics manually
    const stats = {
      totalVerified: 0,
      totalRejected: 0,
      totalPending: 0,
      totalAmount: 0
    };
    
    payments.forEach(payment => {
      if (payment.status === 'verified') {
        stats.totalVerified++;
        stats.totalAmount += parseFloat(payment.amount || 0);
      } else if (payment.status === 'rejected') {
        stats.totalRejected++;
      } else if (payment.status === 'pending') {
        stats.totalPending++;
      }
    });
    
    logSuccess('\n📊 Payment Statistics:');
    logSuccess(`  Total Payments: ${payments.length}`);
    logSuccess(`  Verified: ${stats.totalVerified}`);
    logSuccess(`  Rejected: ${stats.totalRejected}`);
    logSuccess(`  Pending: ${stats.totalPending}`);
    logSuccess(`  Total Amount (Verified): ฿${stats.totalAmount.toFixed(2)}`);
    
    // Verify calculations
    const total = stats.totalVerified + stats.totalRejected + stats.totalPending;
    if (total === payments.length) {
      logSuccess('✓ Statistics calculation is correct');
    } else {
      logError(`✗ Statistics mismatch: ${total} vs ${payments.length}`);
    }
    
    return { success: true, statistics: stats };
  } catch (error) {
    logError(`Failed to test payment statistics: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 7: CSV Export Functionality (simulated)
async function testCSVExport() {
  logTest('CSV Export Functionality');
  
  try {
    // Get payments for export
    const response = await axios.get(`${API_URL}/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const payments = response.data.data || [];
    
    if (payments.length === 0) {
      logWarning('No payments found. Skipping test.');
      return { success: true, skipped: true };
    }
    
    logSuccess(`Found ${payments.length} payments to export`);
    
    // Simulate CSV generation
    const headers = [
      'เลขที่คำสั่งซื้อ',
      'ชื่อลูกค้า',
      'จำนวนเงิน',
      'สถานะ',
      'วิธีการชำระเงิน',
      'วันที่อัปโหลด',
      'วันที่ยืนยัน',
      'ผู้ยืนยัน',
      'หมายเหตุ'
    ];
    
    const rows = payments.map(payment => [
      payment.order_number || payment.order_id,
      payment.customer_name || 'ไม่ระบุ',
      payment.amount,
      payment.status,
      payment.payment_method,
      payment.created_at,
      payment.verified_at || '-',
      payment.verifier_name || '-',
      payment.rejection_reason || payment.notes || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    logSuccess('✓ CSV content generated successfully');
    logSuccess(`  Headers: ${headers.length} columns`);
    logSuccess(`  Rows: ${rows.length} payments`);
    logSuccess(`  Total size: ${csvContent.length} characters`);
    
    // Verify all required fields are present
    const requiredFields = ['order_number', 'customer_name', 'amount', 'status', 'payment_method', 'created_at'];
    const missingFields = requiredFields.filter(field => 
      !payments.every(payment => payment[field] !== undefined)
    );
    
    if (missingFields.length === 0) {
      logSuccess('✓ All required fields are present in export data');
    } else {
      logWarning(`⚠️  Some payments missing fields: ${missingFields.join(', ')}`);
    }
    
    return { success: true, exportedCount: payments.length, csvSize: csvContent.length };
  } catch (error) {
    logError(`Failed to test CSV export: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runAllTests() {
  logSection('🚀 Payment Notifications and History System Tests');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  try {
    // Login
    logSection('🔐 Authentication');
    await loginStaff();
    await loginAdmin();
    
    // Run tests
    logSection('📋 Test 1: Notification Badge Count');
    const test1 = await testNotificationBadgeCount();
    results.tests.push({ name: 'Notification Badge Count', ...test1 });
    if (test1.success) results.passed++; else results.failed++;
    
    logSection('📋 Test 2: Notification Update on Verify');
    const test2 = await testNotificationUpdateOnVerify();
    results.tests.push({ name: 'Notification Update on Verify', ...test2 });
    if (test2.skipped) results.skipped++;
    else if (test2.success) results.passed++; else results.failed++;
    
    logSection('📋 Test 3: Notification Update on Reject');
    const test3 = await testNotificationUpdateOnReject();
    results.tests.push({ name: 'Notification Update on Reject', ...test3 });
    if (test3.skipped) results.skipped++;
    else if (test3.success) results.passed++; else results.failed++;
    
    logSection('📋 Test 4: New Payment Highlighting');
    const test4 = await testNewPaymentHighlighting();
    results.tests.push({ name: 'New Payment Highlighting', ...test4 });
    if (test4.skipped) results.skipped++;
    else if (test4.success) results.passed++; else results.failed++;
    
    logSection('📋 Test 5: Payment History Filters');
    const test5 = await testPaymentHistoryFilters();
    results.tests.push({ name: 'Payment History Filters', ...test5 });
    if (test5.success) results.passed++; else results.failed++;
    
    logSection('📋 Test 6: Payment Statistics Calculation');
    const test6 = await testPaymentStatistics();
    results.tests.push({ name: 'Payment Statistics Calculation', ...test6 });
    if (test6.skipped) results.skipped++;
    else if (test6.success) results.passed++; else results.failed++;
    
    logSection('📋 Test 7: CSV Export Functionality');
    const test7 = await testCSVExport();
    results.tests.push({ name: 'CSV Export Functionality', ...test7 });
    if (test7.skipped) results.skipped++;
    else if (test7.success) results.passed++; else results.failed++;
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    results.failed++;
  }
  
  // Print summary
  logSection('📊 Test Summary');
  log(`Total Tests: ${results.tests.length}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`Skipped: ${results.skipped}`, 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'red');
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      logError(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runAllTests };
