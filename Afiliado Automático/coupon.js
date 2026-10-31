/**
 * Módulo de cupons desativado a pedido do usuário.
 * Mantém interface mínima vazia para evitar quebras em chamadas legadas.
 */
(function (global) {
  'use strict';
  global.MLCoupons = {
    findApplicableCoupons: function () { return []; },
    formatCouponConditions: function () { return ''; },
    extractProductCoupon: function () { return null; },
    calculateDiscountedPrice: function (price) {
      return { finalPrice: price, finalPriceFormatted: '', savings: 0, savingsFormatted: '' };
    },
    parsePriceNumber: function () { return 0; }
  };
})(typeof self !== 'undefined' ? self : this);
