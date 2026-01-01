import React, { useState, useEffect, useRef } from 'react';
import Barcode from 'react-barcode';
import api from '../../config/api';
import SKUPreview from '../../components/product/SKUPreview';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [barcodeSettings, setBarcodeSettings] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'barcode'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [generatedSKU, setGeneratedSKU] = useState('');
  const [originalCategoryId, setOriginalCategoryId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price_excluding_vat: '',
    stock_quantity: '',
    low_stock_threshold: 10,
    status: 'active',
    defects: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [downloadSettings, setDownloadSettings] = useState({
    format: 'png',
    quality: 'high',
    scale: 2,
    showLogo: true
  });
  const printRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100,
        search: searchTerm,
        category_id: selectedCategory || undefined
      };
      const response = await api.get('/products', { params });
      setProducts(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const getBarcodeSize = (productId) => {
    return barcodeSettings[productId]?.size || 'medium';
  };

  const setBarcodeSize = (productId, size) => {
    setBarcodeSettings(prev => ({
      ...prev,
      [productId]: { ...prev[productId], size }
    }));
  };

  const getBarcodeWidth = (size) => {
    switch (size) {
      case 'small': return 1.5;
      case 'medium': return 2;
      case 'large': return 3;
      default: return 2;
    }
  };

  const getBarcodeHeight = (size) => {
    switch (size) {
      case 'small': return 40;
      case 'medium': return 60;
      case 'large': return 80;
      default: return 60;
    }
  };

  const printBarcode = (product) => {
    const size = getBarcodeSize(product.product_id);
    const showLogo = downloadSettings.showLogo;
    const printWindow = window.open('', '_blank');
    const barcodeValue = product.sku; // ใช้ SKU แทน Product ID
    
    // Get logo from localStorage or use default
    const customLogo = localStorage.getItem('shopLogo');
    const logoSrc = customLogo || '/logo.svg';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>พิมพ์บาร์โค้ด - ${product.name}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { 
                margin: 0.5cm;
                size: auto;
              }
              body { 
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Sarabun', Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
              background: #f5f5f5;
            }
            .barcode-container {
              text-align: center;
              border: 2px dashed #ccc;
              padding: 30px;
              background: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border-radius: 10px;
              position: relative;
              overflow: hidden;
            }
            .background-logo {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              min-width: 100%;
              min-height: 100%;
              width: auto;
              height: auto;
              opacity: 0.20;
              z-index: 0;
              pointer-events: none;
              object-fit: cover;
            }
            .content-wrapper {
              position: relative;
              z-index: 1;
            }
            .product-info {
              margin-bottom: 20px;
            }
            .product-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .product-sku {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .product-price {
              font-size: 16px;
              color: #2563eb;
              margin-top: 10px;
              font-weight: bold;
            }
            .barcode-wrapper {
              margin: 20px 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100px;
            }
            svg {
              max-width: 100%;
              height: auto;
            }
            .loading {
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${showLogo ? `<img src="${logoSrc}" alt="Shop Logo" class="background-logo" onerror="this.style.display='none'">` : ''}
            <div class="content-wrapper">
              <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-sku">SKU: ${product.sku}</div>
                <div class="product-price">฿${parseFloat(product.price_including_vat).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="barcode-wrapper">
                <svg id="barcode"></svg>
              </div>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            // Wait for JsBarcode to load
            function generateBarcode() {
              if (typeof JsBarcode !== 'undefined') {
                try {
                  JsBarcode("#barcode", "${barcodeValue}", {
                    format: "CODE128",
                    width: ${getBarcodeWidth(size)},
                    height: ${getBarcodeHeight(size)},
                    displayValue: true,
                    fontSize: 16,
                    margin: 10,
                    background: "#ffffff",
                    lineColor: "#000000"
                  });
                  
                  // Wait a bit for rendering then print
                  setTimeout(function() {
                    window.print();
                  }, 1000);
                } catch (error) {
                  console.error('Barcode generation error:', error);
                  var wrapper = document.querySelector('.barcode-wrapper');
                  wrapper.innerHTML = '<div style="color: red;">เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ' + error.message + '</div>';
                }
              } else {
                // Retry if library not loaded yet
                setTimeout(generateBarcode, 100);
              }
            }
            
            // Start generation when page loads
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', generateBarcode);
            } else {
              generateBarcode();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openAddModal = () => {
    setModalMode('add');
    setGeneratedSKU('');
    setFormData({
      name: '',
      description: '',
      category_id: '',
      price_excluding_vat: '',
      stock_quantity: '',
      low_stock_threshold: 10,
      status: 'active',
      defects: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setGeneratedSKU(product.sku); // Store existing SKU for display
    setOriginalCategoryId(product.category_id); // Store original category
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      price_excluding_vat: product.price_excluding_vat,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 10,
      status: product.status,
      defects: product.defects || ''
    });
    setImageFile(null);
    setImagePreview(product.image_path ? `http://localhost:5050${product.image_path}` : null);
    setShowModal(true);
  };

  const openBarcodeModal = (product) => {
    setModalMode('barcode');
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSKUGenerated = (sku) => {
    setGeneratedSKU(sku);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('กรุณาเลือกไฟล์รูปภาพ .jpg หรือ .png เท่านั้น');
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        e.target.value = '';
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const downloadBarcode = (product, format = 'png') => {
    const size = getBarcodeSize(product.product_id);
    const scale = downloadSettings.scale;
    const showLogo = downloadSettings.showLogo;
    
    // Create a temporary canvas - Landscape orientation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions for landscape layout
    const barcodeWidth = getBarcodeWidth(size);
    const barcodeHeight = getBarcodeHeight(size);
    const padding = 40 * scale;
    
    // Calculate actual content dimensions with proper spacing
    const titleFontSize = 20 * scale;
    const infoFontSize = 14 * scale;
    const skuFontSize = 16 * scale;
    
    const titleHeight = titleFontSize + 10 * scale;
    const infoHeight = infoFontSize + 15 * scale;
    const barcodeSpacing = 25 * scale;
    const skuTextHeight = skuFontSize + 15 * scale;
    
    // Estimate barcode actual width (CODE128 typically 11 bars per character + margins)
    const estimatedBarcodeWidth = (product.sku.length * 11 * barcodeWidth) + (20 * scale);
    
    // Set canvas size - LANDSCAPE: width must be significantly larger than height
    canvas.width = Math.max(800 * scale, estimatedBarcodeWidth + (padding * 2));
    canvas.height = padding * 2 + titleHeight + infoHeight + barcodeSpacing + (barcodeHeight * scale) + skuTextHeight;
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load logo if enabled
    const loadLogo = () => {
      return new Promise((resolve) => {
        if (!showLogo) {
          resolve(null);
          return;
        }
        
        // Check if custom logo exists in localStorage
        const customLogo = localStorage.getItem('shopLogo');
        
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => resolve(logoImg);
        logoImg.onerror = () => {
          // If custom logo fails, try default logo
          if (customLogo) {
            logoImg.src = '/logo.svg';
          } else {
            console.warn('Logo not found, continuing without logo');
            resolve(null);
          }
        };
        
        // Use custom logo if available, otherwise use default
        logoImg.src = customLogo || '/logo.svg';
      });
    };
    
    // Create temporary SVG for barcode
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(tempSvg);
    
    try {
      // Generate barcode
      JsBarcode(tempSvg, product.sku, {
        format: 'CODE128',
        width: barcodeWidth * scale,
        height: barcodeHeight * scale,
        displayValue: false,
        margin: 0
      });
      
      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(tempSvg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = async () => {
        // Load logo
        const logoImg = await loadLogo();
        
        // === BACKGROUND: Draw logo as watermark (if enabled) ===
        if (logoImg) {
          // Calculate logo size to cover full canvas while maintaining aspect ratio
          const logoAspect = logoImg.width / logoImg.height;
          const canvasAspect = canvas.width / canvas.height;
          
          let watermarkWidth, watermarkHeight;
          
          // Cover entire canvas
          if (canvasAspect > logoAspect) {
            // Canvas is wider than logo
            watermarkWidth = canvas.width;
            watermarkHeight = canvas.width / logoAspect;
          } else {
            // Canvas is taller than logo
            watermarkHeight = canvas.height;
            watermarkWidth = canvas.height * logoAspect;
          }
          
          // Center the logo
          const logoX = (canvas.width - watermarkWidth) / 2;
          const logoY = (canvas.height - watermarkHeight) / 2;
          
          // Set opacity for watermark effect (20%)
          ctx.globalAlpha = 0.20;
          ctx.drawImage(logoImg, logoX, logoY, watermarkWidth, watermarkHeight);
          
          // Reset opacity for other elements
          ctx.globalAlpha = 1.0;
        }
        
        // Layout: Product info (center-top), barcode (center), SKU (bottom)
        let currentY = padding;
        
        // === TOP SECTION: Product Info ===
        const centerX = canvas.width / 2;
        
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Product name (larger, bold)
        ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
        ctx.fillText(product.name, centerX, currentY);
        currentY += titleHeight;
        
        // SKU and Price on same line with proper spacing
        const skuText = `SKU: ${product.sku}`;
        const priceText = `฿${parseFloat(product.price_including_vat).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
        
        // Measure text widths to ensure no overlap
        ctx.font = `${infoFontSize}px Arial, sans-serif`;
        const skuWidth = ctx.measureText(skuText).width;
        const priceWidth = ctx.measureText(priceText).width;
        const separatorWidth = 30 * scale;
        const totalInfoWidth = skuWidth + separatorWidth + priceWidth;
        
        // Draw SKU (left side)
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'right';
        ctx.fillText(skuText, centerX - (separatorWidth / 2), currentY);
        
        // Draw separator line
        ctx.fillStyle = '#d1d5db';
        ctx.fillRect(centerX - (separatorWidth / 4), currentY - (infoFontSize * 0.7), 2 * scale, infoFontSize);
        
        // Draw Price (right side)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#2563eb';
        ctx.font = `bold ${infoFontSize}px Arial, sans-serif`;
        ctx.fillText(priceText, centerX + (separatorWidth / 2), currentY);
        
        currentY += infoHeight + barcodeSpacing;
        
        // === MIDDLE SECTION: Barcode ===
        const barcodeX = centerX - (img.width / 2);
        ctx.drawImage(img, barcodeX, currentY);
        currentY += img.height + (15 * scale);
        
        // === BOTTOM SECTION: SKU text below barcode ===
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `bold ${skuFontSize}px Courier New, monospace`;
        ctx.fillText(product.sku, centerX, currentY);
        
        // Add subtle border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(5 * scale, 5 * scale, canvas.width - 10 * scale, canvas.height - 10 * scale);
        
        // Download
        canvas.toBlob((blob) => {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `barcode-${product.sku}.${format}`;
          link.click();
          URL.revokeObjectURL(downloadUrl);
        }, `image/${format}`, format === 'jpg' ? 0.95 : 1);
        
        URL.revokeObjectURL(url);
        document.body.removeChild(tempSvg);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Download error:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด: ' + error.message);
      document.body.removeChild(tempSvg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let productId;
      let createdSKU;
      
      if (modalMode === 'add') {
        // Create product - SKU will be auto-generated by backend
        const response = await api.post('/products', formData);
        productId = response.data.data.product_id;
        createdSKU = response.data.data.sku;
        
        // Upload image if selected
        if (imageFile) {
          const formDataWithImage = new FormData();
          formDataWithImage.append('image', imageFile);
          await api.post(`/products/${productId}/image`, formDataWithImage, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
        
        alert(`เพิ่มสินค้าสำเร็จ!\nSKU: ${createdSKU}`);
      } else if (modalMode === 'edit') {
        productId = selectedProduct.product_id;
        
        // Update product data (SKU is immutable, not sent)
        await api.put(`/products/${productId}`, formData);
        
        // Upload new image if selected
        if (imageFile) {
          const formDataWithImage = new FormData();
          formDataWithImage.append('image', imageFile);
          await api.post(`/products/${productId}/image`, formDataWithImage, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
        
        alert('แก้ไขสินค้าสำเร็จ!');
      }
      
      closeModal();
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      const errorMessage = err.response?.data?.error?.message || err.message;
      const errorCode = err.response?.data?.error?.code;
      
      // Handle specific SKU-related errors
      if (errorCode === 'SKU_LIMIT_REACHED') {
        alert(
          '❌ เกิดข้อผิดพลาด: เลขลำดับ SKU ถึงขีดจำกัดแล้ว\n\n' +
          '💡 แนะนำ:\n' +
          '- สร้างหมวดหมู่ใหม่ที่มี Prefix ต่างกัน\n' +
          '- หรือติดต่อผู้ดูแลระบบเพื่อจัดการหมวดหมู่'
        );
      } else if (errorCode === 'DUPLICATE_SKU') {
        alert(
          '❌ เกิดข้อผิดพลาด: SKU นี้มีอยู่ในระบบแล้ว\n\n' +
          '💡 กรุณาลองอีกครั้ง ระบบจะสร้าง SKU ใหม่โดยอัตโนมัติ'
        );
      } else if (errorCode === 'INVALID_SKU_FORMAT') {
        alert(
          '❌ เกิดข้อผิดพลาด: รูปแบบ SKU ไม่ถูกต้อง\n\n' +
          '💡 SKU ต้องเป็นรูปแบบ: [PREFIX][00001-99999]\n' +
          'เช่น ELEC00001, FASH00123'
        );
      } else if (errorCode === 'CATEGORY_NOT_FOUND') {
        alert(
          '❌ เกิดข้อผิดพลาด: ไม่พบหมวดหมู่ที่เลือก\n\n' +
          '💡 กรุณาเลือกหมวดหมู่ที่มีอยู่ในระบบ'
        );
      } else {
        alert('เกิดข้อผิดพลาด: ' + errorMessage);
      }
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`ต้องการลบสินค้า "${product.name}" ใช่หรือไม่?`)) {
      return;
    }
    try {
      await api.delete(`/products/${product.product_id}`);
      alert('ลบสินค้าสำเร็จ!');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('th-TH', { minimumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="product-management">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>📦 จัดการสินค้าและบาร์โค้ด</h1>
        <p className="subtitle">เพิ่ม แก้ไข ลบสินค้า และสร้างบาร์โค้ด</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="action-bar">
        <button className="btn btn-add" onClick={openAddModal}>
          ➕ เพิ่มสินค้าใหม่
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => window.location.href = '/admin/categories'}
          style={{ marginLeft: '10px' }}
        >
          📂 จัดการหมวดหมู่
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 ค้นหาสินค้า (ชื่อ, SKU)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">📂 หมวดหมู่ทั้งหมด</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}{cat.prefix ? ` (${cat.prefix})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="products-count">
        <span>พบสินค้าทั้งหมด {products.length} รายการ</span>
      </div>

      <div className="products-grid">
        {products.map(product => {
          const barcodeValue = product.sku; // ใช้ SKU แทน Product ID
          const currentSize = getBarcodeSize(product.product_id);
          
          return (
            <div key={product.product_id} className="product-card">
              {product.image_path && (
                <div className="product-image">
                  <img 
                    src={`http://localhost:5050${product.image_path}`} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="product-header">
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-sku">SKU: {product.sku}</p>
                  <p className="product-category">{product.category_name || 'ไม่มีหมวดหมู่'}</p>
                </div>
                <div className="product-price-box">
                  <div className="price-label">ราคา (รวม VAT)</div>
                  <div className="price-value">
                    ฿{formatPrice(product.price_including_vat)}
                  </div>
                </div>
              </div>

              <div className="product-stock">
                <span className={`stock-badge ${product.stock_quantity <= 5 ? 'low-stock' : ''}`}>
                  📦 คงเหลือ: {product.stock_quantity} ชิ้น
                </span>
              </div>

              <div className="product-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => openEditModal(product)}
                  title="แก้ไขสินค้า"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  className="action-btn barcode-btn"
                  onClick={() => openBarcodeModal(product)}
                  title="ดูบาร์โค้ด"
                >
                  🏷️ บาร์โค้ด
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(product)}
                  title="ลบสินค้า"
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>ไม่พบสินค้า</h3>
          <p>ลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่</p>
          <button className="btn btn-add" onClick={openAddModal}>
            ➕ เพิ่มสินค้าแรก
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalMode === 'barcode' ? (
              // Barcode Modal
              <div className="barcode-modal">
                <div className="modal-header">
                  <h2>🏷️ บาร์โค้ดสินค้า</h2>
                  <button className="close-btn" onClick={closeModal}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="product-detail">
                    <h3>{selectedProduct.name}</h3>
                    <p>SKU: {selectedProduct.sku}</p>
                    <p className="price">฿{formatPrice(selectedProduct.price_including_vat)}</p>
                  </div>

                  <div className="barcode-controls">
                    <label className="size-label">ขนาดบาร์โค้ด:</label>
                    <div className="size-buttons">
                      <button
                        className={`size-btn ${getBarcodeSize(selectedProduct.product_id) === 'small' ? 'active' : ''}`}
                        onClick={() => setBarcodeSize(selectedProduct.product_id, 'small')}
                      >
                        เล็ก
                      </button>
                      <button
                        className={`size-btn ${getBarcodeSize(selectedProduct.product_id) === 'medium' ? 'active' : ''}`}
                        onClick={() => setBarcodeSize(selectedProduct.product_id, 'medium')}
                      >
                        กลาง
                      </button>
                      <button
                        className={`size-btn ${getBarcodeSize(selectedProduct.product_id) === 'large' ? 'active' : ''}`}
                        onClick={() => setBarcodeSize(selectedProduct.product_id, 'large')}
                      >
                        ใหญ่
                      </button>
                    </div>
                  </div>

                  <div className="barcode-display">
                    <Barcode
                      value={selectedProduct.sku}
                      format="CODE128"
                      width={getBarcodeWidth(getBarcodeSize(selectedProduct.product_id))}
                      height={getBarcodeHeight(getBarcodeSize(selectedProduct.product_id))}
                      displayValue={true}
                      fontSize={14}
                      margin={10}
                    />
                  </div>

                  <div className="download-settings">
                    <h4>⚙️ ตั้งค่าดาวน์โหลด</h4>
                    <div className="settings-grid">
                      <div className="setting-group">
                        <label>รูปแบบไฟล์:</label>
                        <select
                          value={downloadSettings.format}
                          onChange={(e) => setDownloadSettings({...downloadSettings, format: e.target.value})}
                        >
                        <option value="png">PNG (แนะนำ)</option>
                        <option value="jpg">JPG</option>
                        </select>
                      </div>
                      <div className="setting-group">
                        <label>ความละเอียด:</label>
                        <select
                          value={downloadSettings.scale}
                          onChange={(e) => setDownloadSettings({...downloadSettings, scale: parseFloat(e.target.value)})}
                        >
                          <option value="1">มาตรฐาน (1x)</option>
                          <option value="2">สูง (2x)</option>
                          <option value="3">สูงมาก (3x)</option>
                          <option value="4">สูงสุด (4x)</option>
                        </select>
                      </div>
                      <div className="setting-group full-width">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={downloadSettings.showLogo}
                            onChange={(e) => setDownloadSettings({...downloadSettings, showLogo: e.target.checked})}
                          />
                          <span>แสดงโลโก้ร้านค้า</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="barcode-actions">
                    <button
                      className="download-btn png-btn"
                      onClick={() => downloadBarcode(selectedProduct, downloadSettings.format)}
                    >
                      💾 ดาวน์โหลดเป็น {downloadSettings.format.toUpperCase()}
                    </button>
                    <button
                      className="print-btn"
                      onClick={() => printBarcode(selectedProduct)}
                    >
                      🖨️ พิมพ์บาร์โค้ด
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Add/Edit Modal
              <div className="form-modal">
                <div className="modal-header">
                  <h2>{modalMode === 'add' ? '➕ เพิ่มสินค้าใหม่' : '✏️ แก้ไขสินค้า'}</h2>
                  <button className="close-btn" onClick={closeModal}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>รูปภาพสินค้า</label>
                      <div className="image-upload-section">
                        {imagePreview ? (
                          <div className="image-preview-container">
                            <img src={imagePreview} alt="Preview" className="image-preview" />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={handleRemoveImage}
                              title="ลบรูปภาพ"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="image-upload-placeholder">
                            <div className="upload-icon">📷</div>
                            <p>ไม่มีรูปภาพ</p>
                          </div>
                        )}
                        <input
                          type="file"
                          id="product-image"
                          accept=".jpg,.jpeg,.png"
                          onChange={handleImageChange}
                          className="file-input"
                        />
                        <label htmlFor="product-image" className="file-input-label">
                          {imagePreview ? '📁 เปลี่ยนรูปภาพ' : '📁 เลือกรูปภาพ'}
                        </label>
                        <p className="file-hint">รองรับไฟล์ .jpg, .png (ขนาดไม่เกิน 5MB)</p>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <SKUPreview
                        categoryId={formData.category_id}
                        onSKUGenerated={handleSKUGenerated}
                        existingSKU={modalMode === 'edit' ? selectedProduct?.sku : null}
                      />
                    </div>

                    <div className="form-group">
                      <label>ชื่อสินค้า *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="ชื่อสินค้า"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>รายละเอียด</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="รายละเอียดสินค้า"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>ตำหนิของสินค้า</label>
                      <textarea
                        name="defects"
                        value={formData.defects}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="ระบุตำหนิของสินค้า (ถ้ามี)"
                      />
                      <p className="field-hint">⚠️ ข้อมูลนี้จะแสดงในหน้ารายละเอียดสินค้า</p>
                    </div>

                    <div className="form-group">
                      <label>หมวดหมู่</label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                      >
                        <option value="">-- เลือกหมวดหมู่ --</option>
                        {categories.map(cat => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.name}{cat.prefix ? ` (${cat.prefix})` : ''}
                          </option>
                        ))}
                      </select>
                      {modalMode === 'edit' && formData.category_id !== originalCategoryId && (
                        <p className="field-hint warning-hint">
                          ⚠️ การเปลี่ยนหมวดหมู่จะไม่เปลี่ยน SKU ของสินค้า (SKU: {selectedProduct?.sku})
                        </p>
                      )}
                    </div>

                    <div className="form-group">
                      <label>ราคา (ไม่รวม VAT) *</label>
                      <input
                        type="number"
                        name="price_excluding_vat"
                        value={formData.price_excluding_vat}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label>จำนวนสต็อก *</label>
                      <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>แจ้งเตือนสต็อกต่ำ</label>
                      <input
                        type="number"
                        name="low_stock_threshold"
                        value={formData.low_stock_threshold}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="10"
                      />
                    </div>

                    <div className="form-group">
                      <label>สถานะ</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">ใช้งาน</option>
                        <option value="inactive">ไม่ใช้งาน</option>
                        <option value="out_of_stock">สินค้าหมด</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-cancel" onClick={closeModal}>
                      ยกเลิก
                    </button>
                    <button type="submit" className="btn btn-submit">
                      {modalMode === 'add' ? '➕ เพิ่มสินค้า' : '💾 บันทึก'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
