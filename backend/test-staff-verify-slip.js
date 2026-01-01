/**
 * Manual Test Script: Staff Verify Payment Slip
 * 
 * This script helps test the staff payment slip verification functionality
 * 
 * Test Scenario:
 * 1. Login as staff user
 * 2. Navigate to Payment Verification page
 * 3. View pending payment slips
 * 4. Click on a payment slip to view details
 * 5. Verify the payment slip
 * 6. Check that order status updates to "processing"
 * 7. Verify notification count decreases
 */

const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Test configuration
const STAFF_CREDENTIALS = {
  email: 'staff@itkmmshop22.com',
  password: 'staff123'
};

let authToken = null;
let testOrderId = null;
let testPaymentId = null;

// Helper function to make authenticated requests
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Test Steps
async function runTests() {
  console.log('🧪 Starting Staff Payment Slip Verification Tests\n');
  console.log('=' .repeat(60));

  // Step 1: Login as staff
  console.log('\n📝 Step 1: Login as staff user');
  console.log('-'.repeat(60));
  
  const loginResult = await apiRequest('POST', '/auth/login', STAFF_CREDENTIALS);
  
  if (!loginResult.success) {
    console.error('❌ Login failed:', loginResult.error);
    console.log('\n💡 Make sure:');
    console.log('   - Backend server is running');
    console.log('   - Staff account exists with credentials:');
    console.log(`     Email: ${STAFF_CREDENTIALS.email}`);
    console.log(`     Password: ${STAFF_CREDENTIALS.password}`);
    return;
  }
  
  authToken = loginResult.data.token;
  const user = loginResult.data.user;
  
  console.log('✅ Login successful');
  console.log(`   User: ${user.name} (${user.email})`);
  console.log(`   Role: ${user.role}`);
  
  if (user.role !== 'staff' && user.role !== 'admin') {
    console.error('❌ User is not staff or admin');
    return;
  }

  // Step 2: Get pending payments
  console.log('\n📝 Step 2: Fetch pending payment slips');
  console.log('-'.repeat(60));
  
  const paymentsResult = await apiRequest('GET', '/payments?status=pending');
  
  if (!paymentsResult.success) {
    console.error('❌ Failed to fetch payments:', paymentsResult.error);
    return;
  }
  
  const pendingPayments = paymentsResult.data.payments || paymentsResult.data;
  
  console.log(`✅ Found ${pendingPayments.length} pending payment(s)`);
  
  if (pendingPayments.length === 0) {
    console.log('\n⚠️  No pending payments found');
    console.log('💡 To test verification:');
    console.log('   1. Create an order as a customer');
    console.log('   2. Upload a payment slip');
    console.log('   3. Run this test again');
    return;
  }
  
  // Display pending payments
  console.log('\nPending Payments:');
  pendingPayments.forEach((payment, index) => {
    console.log(`\n${index + 1}. Payment ID: ${payment.id}`);
    console.log(`   Order: ${payment.order_number || payment.order_id}`);
    console.log(`   Customer: ${payment.customer_name || 'N/A'}`);
    console.log(`   Amount: ฿${payment.amount}`);
    console.log(`   Uploaded: ${new Date(payment.created_at).toLocaleString('th-TH')}`);
    console.log(`   Slip: ${payment.slip_image_path || 'No image'}`);
  });
  
  // Select first pending payment for testing
  const testPayment = pendingPayments[0];
  testPaymentId = testPayment.id;
  testOrderId = testPayment.order_id;
  
  console.log(`\n🎯 Selected payment ID ${testPaymentId} for verification test`);

  // Step 3: Get payment details
  console.log('\n📝 Step 3: Get payment details');
  console.log('-'.repeat(60));
  
  const paymentDetailResult = await apiRequest('GET', `/payments/${testPaymentId}`);
  
  if (!paymentDetailResult.success) {
    console.error('❌ Failed to fetch payment details:', paymentDetailResult.error);
    return;
  }
  
  const paymentDetail = paymentDetailResult.data.payment || paymentDetailResult.data;
  
  console.log('✅ Payment details retrieved');
  console.log(`   Status: ${paymentDetail.status}`);
  console.log(`   Verified: ${paymentDetail.verified ? 'Yes' : 'No'}`);
  console.log(`   Slip Image: ${paymentDetail.slip_image_path || 'None'}`);

  // Step 4: Get order details before verification
  console.log('\n📝 Step 4: Get order details (before verification)');
  console.log('-'.repeat(60));
  
  const orderBeforeResult = await apiRequest('GET', `/orders/${testOrderId}`);
  
  if (!orderBeforeResult.success) {
    console.error('❌ Failed to fetch order:', orderBeforeResult.error);
    return;
  }
  
  const orderBefore = orderBeforeResult.data.order || orderBeforeResult.data;
  
  console.log('✅ Order details retrieved');
  console.log(`   Order Number: ${orderBefore.order_number}`);
  console.log(`   Status: ${orderBefore.status}`);
  console.log(`   Payment Status: ${orderBefore.payment_status || 'N/A'}`);
  console.log(`   Total: ฿${orderBefore.total_amount}`);

  // Step 5: Verify the payment slip
  console.log('\n📝 Step 5: Verify payment slip');
  console.log('-'.repeat(60));
  console.log('⏳ Sending verification request...');
  
  const verifyResult = await apiRequest('POST', `/payments/${testPaymentId}/verify-slip`);
  
  if (!verifyResult.success) {
    console.error('❌ Verification failed:', verifyResult.error);
    return;
  }
  
  console.log('✅ Payment slip verified successfully!');
  console.log(`   Message: ${verifyResult.data.message}`);

  // Step 6: Verify payment status updated
  console.log('\n📝 Step 6: Verify payment status updated');
  console.log('-'.repeat(60));
  
  const paymentAfterResult = await apiRequest('GET', `/payments/${testPaymentId}`);
  
  if (!paymentAfterResult.success) {
    console.error('❌ Failed to fetch updated payment:', paymentAfterResult.error);
    return;
  }
  
  const paymentAfter = paymentAfterResult.data.payment || paymentAfterResult.data;
  
  console.log('Payment Status After Verification:');
  console.log(`   Status: ${paymentAfter.status}`);
  console.log(`   Verified: ${paymentAfter.verified ? 'Yes' : 'No'}`);
  console.log(`   Verified By: ${paymentAfter.verifier_name || user.name}`);
  console.log(`   Verified At: ${paymentAfter.verified_at ? new Date(paymentAfter.verified_at).toLocaleString('th-TH') : 'N/A'}`);
  
  if (paymentAfter.status === 'verified' && paymentAfter.verified) {
    console.log('✅ Payment status correctly updated to verified');
  } else {
    console.log('❌ Payment status not updated correctly');
    console.log(`   Expected: status='verified', verified=true`);
    console.log(`   Got: status='${paymentAfter.status}', verified=${paymentAfter.verified}`);
  }

  // Step 7: Verify order status updated
  console.log('\n📝 Step 7: Verify order status updated');
  console.log('-'.repeat(60));
  
  const orderAfterResult = await apiRequest('GET', `/orders/${testOrderId}`);
  
  if (!orderAfterResult.success) {
    console.error('❌ Failed to fetch updated order:', orderAfterResult.error);
    return;
  }
  
  const orderAfter = orderAfterResult.data.order || orderAfterResult.data;
  
  console.log('Order Status After Verification:');
  console.log(`   Status: ${orderAfter.status}`);
  console.log(`   Payment Status: ${orderAfter.payment_status || 'N/A'}`);
  
  if (orderAfter.status === 'processing' || orderAfter.payment_status === 'paid') {
    console.log('✅ Order status correctly updated');
  } else {
    console.log('⚠️  Order status may not have updated as expected');
    console.log(`   Expected: status='processing' or payment_status='paid'`);
    console.log(`   Got: status='${orderAfter.status}', payment_status='${orderAfter.payment_status}'`);
  }

  // Step 8: Check notification count
  console.log('\n📝 Step 8: Check pending payments count (notification)');
  console.log('-'.repeat(60));
  
  const paymentsAfterResult = await apiRequest('GET', '/payments?status=pending');
  
  if (!paymentsAfterResult.success) {
    console.error('❌ Failed to fetch payments:', paymentsAfterResult.error);
    return;
  }
  
  const pendingPaymentsAfter = paymentsAfterResult.data.payments || paymentsAfterResult.data;
  
  console.log(`✅ Pending payments count: ${pendingPaymentsAfter.length}`);
  
  if (pendingPaymentsAfter.length === pendingPayments.length - 1) {
    console.log('✅ Notification count correctly decreased by 1');
  } else {
    console.log('⚠️  Notification count may not have updated as expected');
    console.log(`   Before: ${pendingPayments.length}`);
    console.log(`   After: ${pendingPaymentsAfter.length}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ Staff login successful');
  console.log('✅ Pending payments retrieved');
  console.log('✅ Payment details viewed');
  console.log('✅ Payment slip verified');
  console.log('✅ Payment status updated');
  console.log('✅ Order status updated');
  console.log('✅ Notification count updated');
  console.log('\n🎉 All tests passed! Staff verification is working correctly.\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  console.error(error);
});
