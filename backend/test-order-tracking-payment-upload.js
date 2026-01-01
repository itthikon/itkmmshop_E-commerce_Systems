/**
 * Manual Test Script: Upload Payment Slip from OrderTracking Page
 * 
 * This script helps verify that the payment slip upload functionality
 * works correctly from the OrderTracking page.
 * 
 * Test Scenarios:
 * 1. Order without payment slip - should show upload component
 * 2. Order with pending payment slip - should show slip thumbnail and status
 * 3. Order with rejected payment slip - should allow re-upload
 * 4. Order with verified payment slip - should show verified status
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function setupTestData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itkmmshop22'
  });

  console.log('🔍 Setting up test data for OrderTracking payment upload...\n');

  try {
    // Get or create a test customer
    const [customers] = await connection.execute(
      'SELECT id, email, phone FROM users WHERE role = "customer" LIMIT 1'
    );

    if (customers.length === 0) {
      console.log('❌ No customer found. Please create a customer account first.');
      await connection.end();
      return;
    }

    const customer = customers[0];
    console.log(`✓ Using customer: ${customer.email} (ID: ${customer.id})`);

    // Create test orders with different payment scenarios
    const scenarios = [
      {
        name: 'Order without payment slip',
        payment_method: 'bank_transfer',
        status: 'pending',
        create_payment: false
      },
      {
        name: 'Order with pending payment slip',
        payment_method: 'promptpay',
        status: 'pending',
        create_payment: true,
        payment_status: 'pending'
      },
      {
        name: 'Order with failed/rejected payment slip',
        payment_method: 'bank_transfer',
        status: 'pending',
        create_payment: true,
        payment_status: 'failed',
        rejection_reason: 'จำนวนเงินไม่ตรง กรุณาอัปโหลดสลิปใหม่'
      },
      {
        name: 'Order with verified payment slip',
        payment_method: 'promptpay',
        status: 'paid',
        create_payment: true,
        payment_status: 'verified'
      }
    ];

    const testOrders = [];

    for (const scenario of scenarios) {
      // Create order
      const orderNumber = `ORD-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          user_id, order_number, status, payment_status,
          subtotal_excluding_vat, total_vat_amount, total_amount,
          shipping_address, guest_phone, guest_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          orderNumber,
          scenario.status,
          scenario.create_payment && scenario.payment_status === 'verified' ? 'paid' : 'pending',
          1000.00,
          70.00,
          1070.00,
          '123 Test Street, Bangkok 10110',
          customer.phone,
          customer.email
        ]
      );

      const orderId = orderResult.insertId;

      // Add order items
      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_sku, quantity, 
          unit_price_excluding_vat, vat_rate, unit_vat_amount, unit_price_including_vat
        ) VALUES (?, 1, 'Test Product', 'TEST-001', 1, 1000.00, 7.00, 70.00, 1070.00)`,
        [orderId]
      );

      // Create payment record if needed
      let paymentId = null;
      if (scenario.create_payment) {
        const [paymentResult] = await connection.execute(
          `INSERT INTO payments (
            order_id, payment_method, amount, status, 
            slip_image_path, notes
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            scenario.payment_method,
            1070.00,
            scenario.payment_status,
            scenario.payment_status !== 'pending' ? '/uploads/payment-slips/test-slip.jpg' : null,
            scenario.rejection_reason || null
          ]
        );
        paymentId = paymentResult.insertId;
      }

      testOrders.push({
        scenario: scenario.name,
        orderId,
        orderNumber,
        paymentId,
        paymentStatus: scenario.create_payment ? scenario.payment_status : 'none'
      });

      console.log(`\n✓ Created: ${scenario.name}`);
      console.log(`  Order ID: ${orderId}`);
      console.log(`  Order Number: ${orderNumber}`);
      if (paymentId) {
        console.log(`  Payment ID: ${paymentId}`);
        console.log(`  Payment Status: ${scenario.payment_status}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 TEST ORDERS CREATED - Manual Testing Instructions');
    console.log('='.repeat(70));

    console.log('\n🌐 Make sure both servers are running:');
    console.log('   Backend:  http://localhost:5050');
    console.log('   Frontend: http://localhost:3000');

    console.log('\n📝 Test Scenarios:\n');

    testOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.scenario}`);
      console.log(`   URL: http://localhost:3000/track-order/${order.orderId}`);
      console.log(`   Order Number: ${order.orderNumber}`);
      console.log(`   Contact: ${customer.phone} or ${customer.email}`);
      
      if (order.paymentStatus === 'none') {
        console.log(`   ✓ Expected: Should show PaymentSlipUpload component`);
        console.log(`   ✓ Expected: Should show payment instructions`);
        console.log(`   ✓ Test: Upload a payment slip image`);
      } else if (order.paymentStatus === 'pending') {
        console.log(`   ✓ Expected: Should show slip thumbnail`);
        console.log(`   ✓ Expected: Should show "รอตรวจสอบ" status badge`);
        console.log(`   ✓ Test: Click thumbnail to view full size`);
      } else if (order.paymentStatus === 'rejected') {
        console.log(`   ✓ Expected: Should show rejection reason`);
        console.log(`   ✓ Expected: Should show re-upload component`);
        console.log(`   ✓ Test: Upload a new payment slip`);
      } else if (order.paymentStatus === 'verified') {
        console.log(`   ✓ Expected: Should show "ยืนยันแล้ว" status badge`);
        console.log(`   ✓ Expected: Should show verification timestamp`);
        console.log(`   ✓ Expected: Should NOT show upload component`);
      }
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('🧪 Manual Testing Checklist:');
    console.log('='.repeat(70));
    console.log('');
    console.log('For each test order above:');
    console.log('  [ ] Navigate to the order tracking URL');
    console.log('  [ ] Verify payment section displays correctly');
    console.log('  [ ] Test upload functionality (if applicable)');
    console.log('  [ ] Verify file validation (type, size)');
    console.log('  [ ] Check success/error messages');
    console.log('  [ ] Verify slip thumbnail displays (if uploaded)');
    console.log('  [ ] Test full-size viewer modal');
    console.log('  [ ] Verify payment status badges');
    console.log('  [ ] Test re-upload for rejected slips');
    console.log('');
    console.log('Additional Tests:');
    console.log('  [ ] Test drag & drop upload');
    console.log('  [ ] Test invalid file types (.pdf, .txt)');
    console.log('  [ ] Test file size > 5MB');
    console.log('  [ ] Test responsive design (mobile, tablet)');
    console.log('  [ ] Verify payment instructions display');
    console.log('');

    console.log('='.repeat(70));
    console.log('🎯 Key Features to Verify:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. Conditional Display Logic:');
    console.log('   - No slip: Show upload component');
    console.log('   - Has slip: Show thumbnail and status');
    console.log('   - Rejected: Show reason + re-upload component');
    console.log('');
    console.log('2. Upload Component:');
    console.log('   - File input with drag & drop');
    console.log('   - Image preview before upload');
    console.log('   - Upload progress indicator');
    console.log('   - Success/error messages');
    console.log('');
    console.log('3. Slip Viewer:');
    console.log('   - Full-size image display');
    console.log('   - Zoom functionality');
    console.log('   - Order details side-by-side');
    console.log('   - Close button');
    console.log('');
    console.log('4. Status Badges:');
    console.log('   - Pending: Yellow/Amber color');
    console.log('   - Verified: Green color');
    console.log('   - Rejected: Red color');
    console.log('');

    console.log('='.repeat(70));
    console.log('💡 Tips:');
    console.log('='.repeat(70));
    console.log('');
    console.log('- Use browser DevTools to check console for errors');
    console.log('- Test with different image formats (.jpg, .jpeg, .png)');
    console.log('- Test with images of different sizes');
    console.log('- Verify API calls in Network tab');
    console.log('- Check that order status updates after verification');
    console.log('');

    console.log('='.repeat(70));
    console.log('🧹 Cleanup:');
    console.log('='.repeat(70));
    console.log('');
    console.log('After testing, you can delete test orders with:');
    testOrders.forEach(order => {
      console.log(`DELETE FROM order_items WHERE order_id = ${order.orderId};`);
      if (order.paymentId) {
        console.log(`DELETE FROM payments WHERE id = ${order.paymentId};`);
      }
      console.log(`DELETE FROM orders WHERE id = ${order.orderId};`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await connection.end();
  }
}

// Run the setup
setupTestData().catch(console.error);
