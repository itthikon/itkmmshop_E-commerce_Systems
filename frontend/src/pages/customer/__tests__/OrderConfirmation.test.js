/**
 * Integration Tests for OrderConfirmation Page
 * Tests payment slip upload functionality from order confirmation
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrderConfirmation from '../OrderConfirmation';
import api from '../../../config/api';

// Mock the API
jest.mock('../../../config/api');

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ orderId: '123' }),
  useNavigate: () => jest.fn()
}));

// Mock components
jest.mock('../../../components/payment/PaymentSlipUpload', () => {
  return function MockPaymentSlipUpload({ orderId, orderAmount, onUploadSuccess }) {
    return (
      <div data-testid="payment-slip-upload">
        <p>Order ID: {orderId}</p>
        <p>Amount: {orderAmount}</p>
        <button onClick={() => onUploadSuccess({ id: 1, status: 'pending' })}>
          Mock Upload
        </button>
      </div>
    );
  };
});

jest.mock('../../../components/payment/PaymentInstructions', () => {
  return function MockPaymentInstructions({ paymentMethod, orderAmount }) {
    return (
      <div data-testid="payment-instructions">
        <p>Payment Method: {paymentMethod}</p>
        <p>Amount: {orderAmount}</p>
      </div>
    );
  };
});

describe('OrderConfirmation - Payment Slip Upload', () => {
  const mockOrderBankTransfer = {
    id: 123,
    order_number: 'ORD-123456',
    status: 'pending',
    payment_method: 'bank_transfer',
    total_amount: 1500.00,
    subtotal_excluding_vat: 1401.87,
    total_vat: 98.13,
    discount_amount: 0,
    shipping_name: 'Test User',
    shipping_phone: '0812345678',
    shipping_address: '123 Test St',
    shipping_district: 'Test District',
    shipping_province: 'Bangkok',
    shipping_postal_code: '10100',
    created_at: '2024-01-01T10:00:00Z',
    items: [
      {
        product_name: 'Test Product',
        quantity: 2,
        unit_price_including_vat: 750.00,
        line_total_including_vat: 1500.00
      }
    ]
  };

  const mockOrderPromptPay = {
    ...mockOrderBankTransfer,
    payment_method: 'promptpay'
  };

  const mockOrderCOD = {
    ...mockOrderBankTransfer,
    payment_method: 'cod'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display payment slip upload section for bank_transfer orders', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrderBankTransfer
      }
    });

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('สั่งซื้อสำเร็จ!')).toBeInTheDocument();
    });

    // Should show payment instructions
    expect(screen.getByTestId('payment-instructions')).toBeInTheDocument();
    expect(screen.getByText('Payment Method: bank_transfer')).toBeInTheDocument();

    // Should show upload component
    expect(screen.getByTestId('payment-slip-upload')).toBeInTheDocument();
    const uploadSection = screen.getByTestId('payment-slip-upload');
    expect(uploadSection).toHaveTextContent('Order ID: 123');
    expect(uploadSection).toHaveTextContent('Amount: 1500');

    // Should show skip button
    expect(screen.getByText(/ข้ามไปก่อน อัปโหลดทีหลังได้/)).toBeInTheDocument();
  });

  test('should display payment slip upload section for promptpay orders', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrderPromptPay
      }
    });

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('สั่งซื้อสำเร็จ!')).toBeInTheDocument();
    });

    // Should show payment instructions
    expect(screen.getByTestId('payment-instructions')).toBeInTheDocument();
    expect(screen.getByText('Payment Method: promptpay')).toBeInTheDocument();

    // Should show upload component
    expect(screen.getByTestId('payment-slip-upload')).toBeInTheDocument();
  });

  test('should NOT display payment slip upload section for COD orders', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrderCOD
      }
    });

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('สั่งซื้อสำเร็จ!')).toBeInTheDocument();
    });

    // Should NOT show payment instructions
    expect(screen.queryByTestId('payment-instructions')).not.toBeInTheDocument();

    // Should NOT show upload component
    expect(screen.queryByTestId('payment-slip-upload')).not.toBeInTheDocument();
  });

  test('should handle successful upload', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrderBankTransfer
      }
    });

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('สั่งซื้อสำเร็จ!')).toBeInTheDocument();
    });

    // Simulate successful upload
    const uploadButton = screen.getByText('Mock Upload');
    fireEvent.click(uploadButton);

    // Should call API to refresh order data
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/orders/123');
    });
  });

  test('should display order details correctly', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockOrderBankTransfer
      }
    });

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('สั่งซื้อสำเร็จ!')).toBeInTheDocument();
    });

    // Check order number
    expect(screen.getByText(/#123/)).toBeInTheDocument();

    // Check shipping address
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('0812345678')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();

    // Check order items
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('จำนวน: 2 ชิ้น')).toBeInTheDocument();

    // Check totals - use getAllByText and check the first occurrence
    const subtotalElements = screen.getAllByText(/1,401\.87/);
    expect(subtotalElements.length).toBeGreaterThan(0);
    
    const vatElements = screen.getAllByText(/98\.13/);
    expect(vatElements.length).toBeGreaterThan(0);
    
    const totalElements = screen.getAllByText(/1,500\.00/);
    expect(totalElements.length).toBeGreaterThan(0);
  });

  test('should display loading state', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    expect(screen.getByText('กำลังโหลดข้อมูลคำสั่งซื้อ...')).toBeInTheDocument();
  });

  test('should display error state when order fetch fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <OrderConfirmation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
      expect(screen.getByText('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้')).toBeInTheDocument();
    });
  });
});
