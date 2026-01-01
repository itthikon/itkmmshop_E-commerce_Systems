/**
 * Test Script: Staff Reject Payment Slip with Reason
 * 
 * This script tests the staff's ability to reject a payment slip with a reason.
 * 
 * Test Flow:
 * 1. Create a test order with pending payment
 * 2. Upload a payment slip for the order
 * 3. Staff rejects the slip with a reason
 * 4. Verify the payment status is updated to 'rejected'
 * 5. Verify the rejection reason is stored
 * 6. Verify the customer can see the rejection reason
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials
const STAFF_CREDENTIALS = {
  email: 'staff@itkmmshop.com',
  password: 'staff123'
};

const CUSTOMER_CREDENTIALS = {
  email: 'customer@test.com',
  password: 'customer123'
};

let staffToken = '';
let customerToken = '';
let testOrderId = null;
let testPaymentId = null;

// Helper function to login
async function login(credentials) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create a test order
async function createTestOrder(token) {
  try {
    // First, get available products
    const productsResponse = await axios.get(`${API_URL}/products`);
    const products = productsResponse.data.products;
    
    if (products.length === 0) {
      throw new Error('No products available');
    }

    // Create order with first available product
    const orderData = {
      items: [{
        product_id: products[0].id,
        quantity: 1,
        price: products[0].price
      }],
      shipping_address: {
        full_name: 'Test Customer',
        phone: '0812345678',
        address_line1: '123 Test St',
        district: 'Test District',
        province: 'Bangkok',
        postal_code: '10100'
      },
      payment_method: 'bank_transfer',
      total_amount: products[0].price
    };

    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.order.id;
  } catch (error) {
    console.error('Create order failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to upload payment slip
async function uploadPaymentSlip(orderId, token) {
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    formData.append('slip', testImageBuffer, {
      filename: 'test-slip.png',
      contentType: 'image/png'
    });
    formData.append('order_id', orderId);

    const response = await axios.post(`${API_URL}/payments/upload-slip`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.payment.id;
  } catch (error) {
    console.error('Upload slip failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to get payment details
async function getPaymentDetails(paymentId, token) {
  try {
    const response = await axios.get(`${API_URL}/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get payment details failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to reject payment slip
async function rejectPaymentSlip(paymentId, reason, token) {
  try {
    const response = await axios.post(
      `${API_URL}/payments/${paymentId}/confirm`,
      {
        verified: false,
        rejection_reason: reason
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Reject payment failed:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTest() {
  console.log('🧪 Starting Staff Reject Payment Slip Test...\n');

  try {
    // Step 1: Login as customer
    console.log('📝 Step 1: Login as customer...');
    customerToken = await login(CUSTOMER_CREDENTIALS);
    console.log('✅ Customer logged in successfully\n');

    // Step 2: Create test order
    console.log('📝 Step 2: Create test order...');
    testOrderId = await createTestOrder(customerToken);
    console.log(`✅ Test order created: Order ID ${testOrderId}\n`);

    // Step 3: Upload payment slip
    console.log('📝 Step 3: Upload payment slip...');
    testPaymentId = await uploadPaymentSlip(testOrderId, customerToken);
    console.log(`✅ Payment slip uploaded: Payment ID ${testPaymentId}\n`);

    // Step 4: Login as staff
    console.log('📝 Step 4: Login as staff...');
    staffToken = await login(STAFF_CREDENTIALS);
    console.log('✅ Staff logged in successfully\n');

    // Step 5: Get payment details before rejection
    console.log('📝 Step 5: Get payment details before rejection...');
    const paymentBefore = await getPaymentDetails(testPaymentId, staffToken);
    console.log('Payment status before rejection:', paymentBefore.status);
    console.log('Verified before rejection:', paymentBefore.verified);
    console.log('Rejection reason before:', paymentBefore.rejection_reason || 'None');
    console.log('');

    // Step 6: Reject payment slip with reason
    console.log('📝 Step 6: Reject payment slip with reason...');
    const rejectionReason = 'ยอดเงินไม่ตรงกับคำสั่งซื้อ กรุณาตรวจสอบและอัปโหลดใหม่';
    await rejectPaymentSlip(testPaymentId, rejectionReason, staffToken);
    console.log('✅ Payment slip rejected successfully\n');

    // Step 7: Verify payment status after rejection
    console.log('📝 Step 7: Verify payment status after rejection...');
    const paymentAfter = await getPaymentDetails(testPaymentId, staffToken);
    console.log('Payment status after rejection:', paymentAfter.status);
    console.log('Verified after rejection:', paymentAfter.verified);
    console.log('Rejection reason:', paymentAfter.rejection_reason);
    console.log('Rejected by:', paymentAfter.verifier_name || 'Unknown');
    console.log('Rejected at:', paymentAfter.verified_at || 'Unknown');
    console.log('');

    // Step 8: Verify customer can see rejection reason
    console.log('📝 Step 8: Verify customer can see rejection reason...');
    const customerView = await getPaymentDetails(testPaymentId, customerToken);
    console.log('Customer can see rejection reason:', customerView.rejection_reason);
    console.log('');

    // Validation
    console.log('🔍 Validating results...');
    const validations = [
      {
        name: 'Payment status is rejected',
        pass: paymentAfter.status === 'rejected',
        actual: paymentAfter.status,
        expected: 'rejected'
      },
      {
        name: 'Payment is not verified',
        pass: paymentAfter.verified === false || paymentAfter.verified === 0,
        actual: paymentAfter.verified,
        expected: false
      },
      {
        name: 'Rejection reason is stored',
        pass: paymentAfter.rejection_reason === rejectionReason,
        actual: paymentAfter.rejection_reason,
        expected: rejectionReason
      },
      {
        name: 'Rejection timestamp is recorded',
        pass: !!paymentAfter.verified_at,
        actual: paymentAfter.verified_at,
        expected: 'timestamp'
      },
      {
        name: 'Rejector is recorded',
        pass: !!paymentAfter.verifier_name,
        actual: paymentAfter.verifier_name,
        expected: 'staff name'
      },
      {
        name: 'Customer can see rejection reason',
        pass: customerView.rejection_reason === rejectionReason,
        actual: customerView.rejection_reason,
        expected: rejectionReason
      }
    ];

    let allPassed = true;
    validations.forEach(validation => {
      if (validation.pass) {
        console.log(`✅ ${validation.name}`);
      } else {
        console.log(`❌ ${validation.name}`);
        console.log(`   Expected: ${validation.expected}`);
        console.log(`   Actual: ${validation.actual}`);
        allPassed = false;
      }
    });

    console.log('');
    if (allPassed) {
      console.log('🎉 All tests passed! Staff reject functionality is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the results above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
runTest();
