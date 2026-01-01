/**
 * Integration Tests for OrderTracking Page
 * Tests payment slip upload and display functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrderTracking from '../OrderTracking';
import api from '../../../config/api';

// Mock the API
jest.mock('../../../config/api');

// Mock useParams
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ orderId: '123' }),
  useNavigate: () => mockNavigate
}));

// Mock components
jest.mock('../../../components/payment/PaymentSlipUpload', () => {
  return function MockPaymentSlipUpload({ orderId, orderAmount, onUploadSuccess, showInstructions }) {
    return (
      <div data-testid="payment-slip-upload">
        <p>Order ID: {orderId}</p>
        <p>Amount: {orderAmount}</p>
        <p>Show Instructions: {showInstructions ? 'Yes' : 'No'}</p>
        <button onClick={() => onUploadSuccess({ id: 1, status: 'pending', slip_image_path: '/uploads/slip.jpg' })}>
          Mock Upload
        </button>
      </div>
    );
  };
});

jest.mock('../../../components/payment/PaymentSlipViewer', () => {
  return function MockPaymentSlipViewer({ payment, order, onClose, isStaff }) {
    return (
      <div data-testid="payment-slip-viewer">
        <p>Payment ID: {payment.id}</p>
        <p>Order ID: {order.id}</p>
        <p>Is Staff: {isStaff ? 'Yes' : 'No'}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

describe('OrderTracking - Payment Slip Management', () => {
  const mockOrder = {
    id: 123,
    order_number: 'ORD-123456',
    status: 'pending',
    payment_method: 'bank_transfer',
    payment_status: 'pending',
    total_amount: 1500.00,
    subtotal_excluding_vat: 1401.87,
    total_vat_amount: 98.13,
    discount_amount: 0,
    shipping_cost: 0,
    guest_name: 'Test User',
    guest_phone: '0812345678',
    shipping_address: '123 Test St',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    items: [
      {
        id: 1,
        product_name: 'Test Product',
        quantity: 2,
        line_total_including_vat: 1500.00
      }
    ]
  };

  const mockPaymentPending = {
    id: 1,
    order_id: 123,
    status: 'pending',
    slip_image_path: '/uploads/payment-slips/slip123.jpg',
    created_at: '2024-01-01T10:30:00Z'
  };

  const mockPaymentVerified = {
    ...mockPaymentPending,
    status: 'verified',
    verified_at: '2024-01-01T11:00:00Z',
    verified_by: 1
  };

  const mockPaymentRejected = {
    ...mockPaymentPending,
    status: 'rejected',
    rejection_reason: 'จำนวนเงินไม่ตรง'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display upload section when no payment slip exists', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ data: { success: false } });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Should show "no slip" message
    expect(screen.getByText('📤 ยังไม่ได้อัปโหลดสลิปการโอนเงิน')).toBeInTheDocument();

    // Should show upload component with instructions
    expect(screen.getByTestId('payment-slip-upload')).toBeInTheDocument();
    expect(screen.getByText('Show Instructions: Yes')).toBeInTheDocument();
  });

  test('should display slip thumbnail when payment slip exists (pending)', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ 
          data: { 
            success: true, 
            payment: mockPaymentPending 
          } 
        });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Should show slip thumbnail
    const thumbnail = document.querySelector('.slip-thumbnail');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('alt', 'Payment slip');

    // Should show pending status - check for the text content
    expect(screen.getByText(/รอตรวจสอบ/)).toBeInTheDocument();

    // Should show view full button
    expect(screen.getByText(/ดูเต็มขนาด/)).toBeInTheDocument();

    // Should NOT show upload component
    expect(screen.queryByTestId('payment-slip-upload')).not.toBeInTheDocument();
  });

  test('should display verified status when payment is verified', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ 
          data: { 
            success: true, 
            payment: mockPaymentVerified 
          } 
        });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Should show verified status
    expect(screen.getByText(/ยืนยันแล้ว/)).toBeInTheDocument();

    // Should show verification timestamp
    expect(screen.getByText(/ยืนยันเมื่อ:/)).toBeInTheDocument();
  });

  test('should display rejection reason and allow re-upload when payment is rejected', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ 
          data: { 
            success: true, 
            payment: mockPaymentRejected 
          } 
        });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Should show rejected status
    expect(screen.getByText(/ปฏิเสธ/)).toBeInTheDocument();

    // Should show rejection reason
    expect(screen.getByText('จำนวนเงินไม่ตรง')).toBeInTheDocument();

    // Should show re-upload instruction
    expect(screen.getByText('กรุณาอัปโหลดสลิปใหม่ด้านล่าง')).toBeInTheDocument();

    // Should show upload component for re-upload
    const uploadComponents = screen.getAllByTestId('payment-slip-upload');
    expect(uploadComponents.length).toBeGreaterThan(0);
  });

  test('should open slip viewer when clicking view full button', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ 
          data: { 
            success: true, 
            payment: mockPaymentPending 
          } 
        });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Click view full button
    const viewButton = screen.getByText(/ดูเต็มขนาด/);
    fireEvent.click(viewButton);

    // Should show slip viewer
    await waitFor(() => {
      expect(screen.getByTestId('payment-slip-viewer')).toBeInTheDocument();
      expect(screen.getByText('Payment ID: 1')).toBeInTheDocument();
      expect(screen.getByText('Order ID: 123')).toBeInTheDocument();
      expect(screen.getByText('Is Staff: No')).toBeInTheDocument();
    });
  });

  test('should close slip viewer when clicking close button', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ 
          data: { 
            success: true, 
            payment: mockPaymentPending 
          } 
        });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Open viewer
    const viewButton = screen.getByText('🔍 ดูเต็มขนาด');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId('payment-slip-viewer')).toBeInTheDocument();
    });

    // Close viewer
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('payment-slip-viewer')).not.toBeInTheDocument();
    });
  });

  test('should handle successful upload and refresh data', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ data: { success: false } });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Simulate upload
    const uploadButton = screen.getByText('Mock Upload');
    fireEvent.click(uploadButton);

    // Should refresh order data
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/orders/123');
    });
  });

  test('should NOT display payment section for COD orders', async () => {
    const codOrder = { ...mockOrder, payment_method: 'cod' };
    
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: codOrder } });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Should NOT show payment section
    expect(screen.queryByText('การชำระเงิน')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-slip-upload')).not.toBeInTheDocument();
  });

  test('should display order timeline correctly', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/orders/')) {
        return Promise.resolve({ data: { order: mockOrder } });
      }
      if (url.includes('/payments/order/')) {
        return Promise.resolve({ data: { success: false } });
      }
    });

    render(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('คำสั่งซื้อ #ORD-123456')).toBeInTheDocument();
    });

    // Should show status section
    expect(screen.getByText('สถานะคำสั่งซื้อ')).toBeInTheDocument();
  });
});
