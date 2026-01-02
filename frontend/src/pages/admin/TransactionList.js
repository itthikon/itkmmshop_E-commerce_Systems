import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionForm from './TransactionForm';
import './TransactionList.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    transactionType: '',
    search: ''
  });
  
  // Sorting state
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, [filters, sortBy, sortOrder, currentPage]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/accounting/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.transactionType) params.append('type', filters.transactionType);
      if (filters.search) params.append('search', filters.search);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await axios.get(`${API_URL}/accounting/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        setTotalItems(response.data.data.total || 0);
      } else {
        setTransactions([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้');
      setTransactions([]); // Ensure transactions is always an array
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/accounting/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('ลบรายการสำเร็จ');
        fetchTransactions();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert(err.response?.data?.error || 'ไม่สามารถลบรายการได้');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      categoryId: '',
      transactionType: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionTypeLabel = (type) => {
    return type === 'income' ? 'รายรับ' : 'รายจ่าย';
  };

  const getTransactionTypeClass = (type) => {
    return type === 'income' ? 'income' : 'expense';
  };

  const getReferenceTypeLabel = (type) => {
    const labels = {
      'order': 'จากคำสั่งซื้อ',
      'manual': 'บันทึกเอง',
      'other': 'อื่นๆ'
    };
    return labels[type] || type;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Ensure transactions is always an array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="transaction-list-page">
      <div className="page-header">
        <h1>รายการรายรับ-รายจ่าย</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>วันที่เริ่มต้น</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>วันที่สิ้นสุด</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>ประเภท</label>
            <select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              className="filter-input"
            >
              <option value="">ทั้งหมด</option>
              <option value="income">รายรับ</option>
              <option value="expense">รายจ่าย</option>
            </select>
          </div>

          <div className="filter-group">
            <label>หมวดหมู่</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="filter-input"
            >
              <option value="">ทั้งหมด</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'income' ? 'รายรับ' : 'รายจ่าย'})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group search-group">
            <label>ค้นหา</label>
            <input
              type="text"
              placeholder="ค้นหาจากรายละเอียด..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button 
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>พบ {totalItems} รายการ</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading">กำลังโหลดข้อมูล...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={fetchTransactions} className="btn btn-primary">
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && !error && (
        <>
          <div className="table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('transaction_date')} className="sortable">
                    วันที่ {getSortIcon('transaction_date')}
                  </th>
                  <th onClick={() => handleSort('transaction_type')} className="sortable">
                    ประเภท {getSortIcon('transaction_type')}
                  </th>
                  <th>หมวดหมู่</th>
                  <th>รายละเอียด</th>
                  <th>แหล่งที่มา</th>
                  <th onClick={() => handleSort('amount')} className="sortable text-right">
                    จำนวนเงิน {getSortIcon('amount')}
                  </th>
                  <th className="text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {safeTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center empty-state">
                      ไม่พบรายการ
                    </td>
                  </tr>
                ) : (
                  safeTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.transaction_date)}</td>
                      <td>
                        <span className={`transaction-type ${getTransactionTypeClass(transaction.transaction_type)}`}>
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </span>
                      </td>
                      <td>{transaction.category_name}</td>
                      <td className="transaction-description">
                        {transaction.description || '-'}
                      </td>
                      <td>
                        <span className="reference-type">
                          {getReferenceTypeLabel(transaction.reference_type)}
                        </span>
                      </td>
                      <td className={`text-right ${getTransactionTypeClass(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </td>
                      <td className="text-center actions-cell">
                        {transaction.reference_type === 'manual' && (
                          <>
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => handleEdit(transaction)}
                              title="แก้ไข"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDelete(transaction.id)}
                              title="ลบ"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        {transaction.reference_type !== 'manual' && (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ← ก่อนหน้า
              </button>
              
              <span className="pagination-info">
                หน้า {currentPage} จาก {totalPages}
              </span>
              
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป →
              </button>
            </div>
          )}
        </>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default TransactionList;
