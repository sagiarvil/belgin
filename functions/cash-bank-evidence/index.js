'use strict';

/**
 * BELGİN KUYUMCULUK — NAKİT + BANKA HAVALESİ DELİL MOTORU v1.0
 * Kart/3DS motorundan tamamen bağımsız; banka havalesi/EFT/FAST/SWIFT/banka gişe nakit yatırma ve yasal sınırlar içinde mağaza içi nakit tahsilat için,
 * KYC + ödeme + fatura + ürün/stok + teslim + muhasebe + iade + AML + değişmezlik zinciri.
 */

const { getComplianceConfig, COMPLIANCE_VERSIONS } = require('./compliance-config');
const sharedCore = require('./shared-core');
const { BankTransferEngine, BANK_STATES, generateBankTransferDeclarationText } = require('./bank-transfer-engine');
const { CashEngine, CASH_STATES, generateCashDeclarationText } = require('./cash-engine');
const { PaymentEvidenceRouter, BANK_TRANSFER_METHODS, CASH_METHODS } = require('./router');

module.exports = {
  // Router
  PaymentEvidenceRouter,
  BANK_TRANSFER_METHODS,
  CASH_METHODS,

  // Engines
  BankTransferEngine,
  BANK_STATES,
  CashEngine,
  CASH_STATES,

  // Declarations
  generateBankTransferDeclarationText,
  generateCashDeclarationText,

  // Compliance
  getComplianceConfig,
  COMPLIANCE_VERSIONS,

  // Canonical Documents & Byte Hashing
  ...require('./canonical-documents'),

  // Shared Core
  ...sharedCore,
};
