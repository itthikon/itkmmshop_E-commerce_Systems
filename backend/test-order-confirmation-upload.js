/**
 * Test Script: Order Confirmation Upload Section Display
 * 
 * This script tests whether the upload section appears on the Order Confirmation page
 */

const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Test configuration
const CUSTOMER_CREDENTIALS = {
  email: 'customer@itkmmshop22.com',
  password: 'customer123'
};

let authToken = null;

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

async function runTest() {
  console.log('🧪 Testing Order Confirmation Upload Section Display\n');
  console.log('='.repeat(60));

  // Step 1: Login as customer
  console.log('\n📝 Step 1: Login as customer');
  console.log('-'.repeat(60));
  
  const loginResult = await apiRequest('POST', '/auth/login', CUSTOMER_CREDENTIALS);
  
  if (!loginResult.success) {
    console.error('❌ Login failed:', loginResult.error);
    return;
  }
  
  authToken = loginResult.data.token;
  const user = loginResult.data.user;
  
  console.log('✅ Login successful');
  console.log(`   User: ${user.name} (${user.email})`);

  // Step 2: Get customer's orders
  console.log('\n📝 Step 2: Fetch customer orders');
  console.log('-'.repeat(60));
  
  const ordersResult = await apiRequest('GET', '/orders/my-orders');
  
  if (!ordersResult.success) {
    console.error('❌ Failed to fetch orders:', ordersResult.error);
    return;
  }
  
  const orders = ordersResult.data.orders || ordersResult.data;
  
  console.log(`✅ Found ${orders.length} order(s)`);
  
  if (orders.length === 0) {
    console.log('\n⚠️  No orders found');
    console.log('💡 Please create an order first');
    return;
  }

  // Step 3: Check each order's payment method
  console.log('\n📝 Step 3: Check orders payment methods');
  console.log('-'.repeat(60));
  
  orders.forEach((order, index) => {
    console.log(`\n${index + 1}. Order ID: ${order.id}`);
    console.log(`   Order Number: ${order.order_number || 'N/A'}`);
    console.log(`   Payment Method: "${order.payment_method}"`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: ฿${order.total_amount}`);
    
    // Check if upload section should show
    const method = order.payment_method?.toLowerCase() || '';
    const shouldShow = method === 'bank_transfer' || 
                      method === 'bank transfer' || 
                      method === 'promptpay' || 
                      method === 'prompt_pay';
    
    if (shouldShow) {
      console.log(`   ✅ Upload section SHOULD show`);
    } else {
      console.log(`   ❌ Upload section will NOT show`);
      console.log(`      (Payment method is: "${order.payment_method}")`);
    }
  });

  // Step 4: Get detailed info for first order
  if (orders.length > 0) {
    const firstOrder = orders[0];
    
    console.log('\n📝 Step 4: Get detailed order info');
    console.log('-'.repeat(60));
    
    const orderDetailResult = await apiRequest('GET', `/orders/${firstOrder.id}`);
    
    if (!orderDetailResult.success) {
      console.error('❌ Failed to fetch order details:', orderDetailResult.error);
      return;
    }
    
    const orderDetail = orderDetailResult.data.data || orderDetailResult.data;
    
    console.log('\nOrder Details:');
    console.log(`   ID: ${orderDetail.id}`);
    console.log(`   Order Number: ${orderDetail.order_number || 'N/A'}`);
    console.log(`   Payment Method: "${orderDetail.payment_method}"`);
    console.log(`   Payment Method Type: ${typeof orderDetail.payment_method}`);
    console.log(`   Status: ${orderDetail.status}`);
    console.log(`   Total Amount: ฿${orderDetail.total_amount}`);
    
    // Check what the frontend logic would do
    const method = orderDetail.payment_method?.toLowerCase() || '';
    console.log(`\n   Lowercase method: "${method}"`);
    
    const checks = {
      'bank_transfer': method === 'bank_transfer',
      'bank transfer': method === 'bank transfer',
      'promptpay': method === 'promptpay',
      'prompt_pay': method === 'prompt_pay'
    };
    
    console.log('\n   Condition checks:');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`      "${key}": ${value ? '✅' : '❌'}`);
    });
    
    const shouldShow = Object.values(checks).some(v => v);
    
    console.log(`\n   ${shouldShow ? '✅' : '❌'} Upload section should ${shouldShow ? 'SHOW' : 'NOT SHOW'}`);
    
    if (!shouldShow) {
      console.log('\n   ⚠️  PROBLEM DETECTED!');
      console.log('   The payment method does not match expected values.');
      console.log('   Expected: "bank_transfer", "bank transfer", "promptpay", or "prompt_pay"');
      console.log(`   Got: "${orderDetail.payment_method}"`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const bankTransferOrders = orders.filter(o => {
    const method = o.payment_method?.toLowerCase() || '';
    return method === 'bank_transfer' || 
           method === 'bank transfer' || 
           method === 'promptpay' || 
           method === 'prompt_pay';
  });
  
  console.log(`Total orders: ${orders.length}`);
  console.log(`Orders with bank_transfer/promptpay: ${bankTransferOrders.length}`);
  console.log(`Orders that should show upload: ${bankTransferOrders.length}`);
  
  if (bankTransferOrders.length > 0) {
    console.log('\n✅ Upload section should appear for these orders');
    console.log('💡 If it doesn\'t appear, check:');
    console.log('   1. Browser console for errors');
    console.log('   2. Network tab for API response');
    console.log('   3. React component state');
  } else {
    console.log('\n⚠️  No orders with bank_transfer or promptpay found');
    console.log('💡 Create a new order with bank transfer payment method');
  }
  
  console.log('\n');
}

runTest().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  console.error(error);
});
