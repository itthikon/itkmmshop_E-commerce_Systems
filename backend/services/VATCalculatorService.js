/**
 * VAT Calculator Service
 * Handles all VAT calculations for the itkmmshop e-commerce system
 * Supports both VAT-inclusive and VAT-exclusive pricing modes
 * Default VAT rate: 7% (configurable)
 */

class VATCalculatorService {
  /**
   * Initialize VAT Calculator with default rate
   * @param {number} defaultRate - Default VAT rate (default: 7.00)
   */
  constructor(defaultRate = 7.00) {
    this.defaultRate = defaultRate;
  }

  /**
   * Set the default VAT rate
   * @param {number} rate - VAT rate percentage (e.g., 7 for 7%)
   */
  setDefaultRate(rate) {
    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      throw new Error('VAT rate must be a number between 0 and 100');
    }
    this.defaultRate = rate;
  }

  /**
   * Get the current default VAT rate
   * @returns {number} Current default VAT rate
   */
  getDefaultRate() {
    return this.defaultRate;
  }

  /**
   * Calculate VAT amount from price excluding VAT
   * @param {number} priceExcludingVAT - Price without VAT
   * @param {number} vatRate - VAT rate percentage (optional, uses default if not provided)
   * @returns {number} VAT amount
   */
  calculateVATAmount(priceExcludingVAT, vatRate = null) {
    const rate = vatRate !== null ? vatRate : this.defaultRate;
    
    if (typeof priceExcludingVAT !== 'number' || priceExcludingVAT < 0) {
      throw new Error('Price excluding VAT must be a non-negative number');
    }
    
    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      throw new Error('VAT rate must be a number between 0 and 100');
    }

    const vatAmount = (priceExcludingVAT * rate) / 100;
    return this.roundToTwoDecimals(vatAmount);
  }

  /**
   * Calculate price including VAT from price excluding VAT
   * @param {number} priceExcludingVAT - Price without VAT
   * @param {number} vatRate - VAT rate percentage (optional, uses default if not provided)
   * @returns {number} Price including VAT
   */
  calculatePriceIncludingVAT(priceExcludingVAT, vatRate = null) {
    const vatAmount = this.calculateVATAmount(priceExcludingVAT, vatRate);
    return this.roundToTwoDecimals(priceExcludingVAT + vatAmount);
  }

  /**
   * Calculate price excluding VAT from price including VAT (reverse calculation)
   * @param {number} priceIncludingVAT - Price with VAT
   * @param {number} vatRate - VAT rate percentage (optional, uses default if not provided)
   * @returns {number} Price excluding VAT
   */
  calculatePriceExcludingVAT(priceIncludingVAT, vatRate = null) {
    const rate = vatRate !== null ? vatRate : this.defaultRate;
    
    if (typeof priceIncludingVAT !== 'number' || priceIncludingVAT < 0) {
      throw new Error('Price including VAT must be a non-negative number');
    }
    
    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      throw new Error('VAT rate must be a number between 0 and 100');
    }

    const priceExcludingVAT = priceIncludingVAT / (1 + rate / 100);
    return this.roundToTwoDecimals(priceExcludingVAT);
  }

  /**
   * Extract VAT amount from price including VAT
   * @param {number} priceIncludingVAT - Price with VAT
   * @param {number} vatRate - VAT rate percentage (optional, uses default if not provided)
   * @returns {number} VAT amount
   */
  extractVATAmount(priceIncludingVAT, vatRate = null) {
    const priceExcludingVAT = this.calculatePriceExcludingVAT(priceIncludingVAT, vatRate);
    return this.roundToTwoDecimals(priceIncludingVAT - priceExcludingVAT);
  }

  /**
   * Calculate complete VAT breakdown for a product
   * @param {number} basePrice - Base price (excluding or including VAT based on mode)
   * @param {string} mode - 'exclusive' or 'inclusive'
   * @param {number} vatRate - VAT rate percentage (optional, uses default if not provided)
   * @returns {Object} Complete VAT breakdown
   */
  calculateVATBreakdown(basePrice, mode = 'exclusive', vatRate = null) {
    const rate = vatRate !== null ? vatRate : this.defaultRate;
    
    if (!['exclusive', 'inclusive'].includes(mode)) {
      throw new Error('Mode must be either "exclusive" or "inclusive"');
    }

    let priceExcludingVAT, vatAmount, priceIncludingVAT;

    if (mode === 'exclusive') {
      priceExcludingVAT = basePrice;
      vatAmount = this.calculateVATAmount(priceExcludingVAT, rate);
      priceIncludingVAT = this.calculatePriceIncludingVAT(priceExcludingVAT, rate);
    } else {
      priceIncludingVAT = basePrice;
      priceExcludingVAT = this.calculatePriceExcludingVAT(priceIncludingVAT, rate);
      vatAmount = this.extractVATAmount(priceIncludingVAT, rate);
    }

    return {
      priceExcludingVAT: this.roundToTwoDecimals(priceExcludingVAT),
      vatRate: rate,
      vatAmount: this.roundToTwoDecimals(vatAmount),
      priceIncludingVAT: this.roundToTwoDecimals(priceIncludingVAT)
    };
  }

  /**
   * Calculate VAT for multiple items (cart or order)
   * @param {Array} items - Array of items with quantity and price
   * @param {string} mode - 'exclusive' or 'inclusive'
   * @param {number} vatRate - VAT rate percentage (optional, uses default if not provided)
   * @returns {Object} Total VAT breakdown
   */
  calculateCartVAT(items, mode = 'exclusive', vatRate = null) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    let totalExcludingVAT = 0;
    let totalVAT = 0;
    let totalIncludingVAT = 0;

    const itemBreakdowns = items.map(item => {
      if (!item.price || !item.quantity) {
        throw new Error('Each item must have price and quantity');
      }

      const breakdown = this.calculateVATBreakdown(item.price, mode, vatRate);
      const quantity = item.quantity;

      const lineTotal = {
        quantity,
        unitPriceExcludingVAT: breakdown.priceExcludingVAT,
        unitVATAmount: breakdown.vatAmount,
        unitPriceIncludingVAT: breakdown.priceIncludingVAT,
        lineTotalExcludingVAT: this.roundToTwoDecimals(breakdown.priceExcludingVAT * quantity),
        lineTotalVAT: this.roundToTwoDecimals(breakdown.vatAmount * quantity),
        lineTotalIncludingVAT: this.roundToTwoDecimals(breakdown.priceIncludingVAT * quantity)
      };

      totalExcludingVAT += lineTotal.lineTotalExcludingVAT;
      totalVAT += lineTotal.lineTotalVAT;
      totalIncludingVAT += lineTotal.lineTotalIncludingVAT;

      return lineTotal;
    });

    return {
      items: itemBreakdowns,
      totals: {
        subtotalExcludingVAT: this.roundToTwoDecimals(totalExcludingVAT),
        totalVAT: this.roundToTwoDecimals(totalVAT),
        totalIncludingVAT: this.roundToTwoDecimals(totalIncludingVAT)
      }
    };
  }

  /**
   * Apply discount and recalculate VAT
   * @param {number} originalPrice - Original price excluding VAT
   * @param {number} discountAmount - Discount amount to apply
   * @param {number} vatRate - VAT rate percentage (optional, uses default if not provided)
   * @returns {Object} Price breakdown after discount
   */
  applyDiscountAndRecalculateVAT(originalPrice, discountAmount, vatRate = null) {
    if (typeof originalPrice !== 'number' || originalPrice < 0) {
      throw new Error('Original price must be a non-negative number');
    }
    
    if (typeof discountAmount !== 'number' || discountAmount < 0) {
      throw new Error('Discount amount must be a non-negative number');
    }

    if (discountAmount > originalPrice) {
      throw new Error('Discount amount cannot exceed original price');
    }

    const discountedPrice = originalPrice - discountAmount;
    const breakdown = this.calculateVATBreakdown(discountedPrice, 'exclusive', vatRate);

    return {
      originalPriceExcludingVAT: this.roundToTwoDecimals(originalPrice),
      discountAmount: this.roundToTwoDecimals(discountAmount),
      discountedPriceExcludingVAT: breakdown.priceExcludingVAT,
      vatAmount: breakdown.vatAmount,
      finalPriceIncludingVAT: breakdown.priceIncludingVAT
    };
  }

  /**
   * Round number to 2 decimal places
   * @param {number} value - Value to round
   * @returns {number} Rounded value
   */
  roundToTwoDecimals(value) {
    return Math.round(value * 100) / 100;
  }
}

// Export singleton instance
const vatCalculator = new VATCalculatorService(parseFloat(process.env.DEFAULT_VAT_RATE) || 7.00);

module.exports = vatCalculator;
module.exports.VATCalculatorService = VATCalculatorService;
