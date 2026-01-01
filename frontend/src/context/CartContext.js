import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../config/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch cart data
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      if (response.data.success) {
        const cart = response.data.data;
        setCartData(cart);
        
        // Calculate total items
        const totalItems = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartCount(0);
      setCartData(null);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await api.post('/cart/add', {
        product_id: productId,
        quantity: quantity
      });
      
      if (response.data.success) {
        await fetchCart(); // Refresh cart
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'เกิดข้อผิดพลาด' 
      };
    }
  };

  // Update item quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      const response = await api.put('/cart/update', {
        product_id: productId,
        quantity: quantity
      });
      
      if (response.data.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      const response = await api.delete(`/cart/remove/${productId}`);
      
      if (response.data.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: error.message };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const response = await api.delete('/cart/clear');
      
      if (response.data.success) {
        setCartCount(0);
        setCartData(null);
        return { success: true };
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error: error.message };
    }
  };

  // Refresh cart (manual refresh)
  const refreshCart = () => {
    fetchCart();
  };

  // Load cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const value = {
    cartCount,
    cartData,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
