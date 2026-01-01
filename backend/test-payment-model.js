// Test Payment model directly
const Payment = require('./models/Payment');

async function test() {
  try {
    console.log('Testing Payment.findAll...');
    const payments = await Payment.findAll({ status: 'pending' });
    console.log('Success! Found', payments.length, 'payments');
    console.log(JSON.stringify(payments, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

test();
