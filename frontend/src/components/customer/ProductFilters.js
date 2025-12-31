import React from 'react';
import './ProductFilters.css';

const ProductFilters = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="product-filters">
      <div className="filter-section search-section">
        <input
          type="text"
          className="search-input"
          placeholder="ค้นหาสินค้า..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="filter-section">
        <label className="filter-label">หมวดหมู่:</label>
        <select 
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">ทั้งหมด</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="filter-section">
        <label className="filter-label">เรียงตาม:</label>
        <select 
          className="filter-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="">เริ่มต้น</option>
          <option value="price_asc">ราคา: ต่ำ - สูง</option>
          <option value="price_desc">ราคา: สูง - ต่ำ</option>
          <option value="popularity">ความนิยม</option>
          <option value="newest">ใหม่ล่าสุด</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilters;
