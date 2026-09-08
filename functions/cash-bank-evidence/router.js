'use strict';

const { BankTransferEngine } = require('./bank-transfer-engine');
const { CashEngine } = require('./cash-engine');

const BANK_TRANSFER_METHODS = new Set([
  'EFT',
  'FAST',
  'HAVALE',
  'SWIFT',
  'BANK_COUNTER_CASH_DEPOSIT',
  'BANK_TRANSFER',
  'HAVALE_EFT',
]);

const CASH_METHODS = new Set([
  'CASH_COUNTER',
  'NAKIT',
  'STORE_CASH',
]);

class PaymentEvidenceRouter {
  constructor(options = {}) {
    this.bankTransferEngine = new BankTransferEngine(options);
    this.cashEngine = new CashEngine(options);
  }

  route(paymentMethod) {
    const norm = String(paymentMethod || '').trim().toUpperCase();
    if (norm === 'CARD' || norm === 'CREDIT_CARD' || norm === '3DS' || norm === 'PAYTR') {
      return {
        target: 'EXISTING_CARD_ENGINE',
        action: 'DELEGATE_TO_CARD_ENGINE',
        notes: 'Mevcut kredi kartı 3DS delil motoruna dokunulmaz; kart akışı korunur.',
      };
    }
    if (BANK_TRANSFER_METHODS.has(norm)) {
      return {
        target: 'BANK_TRANSFER_ENGINE',
        action: 'PROCESS_BANK_TRANSFER',
      };
    }
    if (CASH_METHODS.has(norm)) {
      return {
        target: 'CASH_ENGINE',
        action: 'PROCESS_CASH_COUNTER',
      };
    }
    return {
      target: 'UNKNOWN',
      action: 'REJECT',
      error: `Tanımlanmayan ödeme yöntemi: ${paymentMethod}`,
    };
  }

  process(input = {}) {
    const method = input.paymentMethod || input.order?.paymentMethod;
    const routing = this.route(method);

    if (routing.target === 'EXISTING_CARD_ENGINE') {
      return {
        routing,
        delegated: true,
        message: 'Kredi kartı işlemi tespit edildi; mevcut kart motoru devrededir.',
      };
    }

    if (routing.target === 'BANK_TRANSFER_ENGINE') {
      const result = this.bankTransferEngine.processOrderEvidence(input);
      return {
        routing,
        delegated: false,
        result,
      };
    }

    if (routing.target === 'CASH_ENGINE') {
      const result = this.cashEngine.processOrderEvidence(input);
      return {
        routing,
        delegated: false,
        result,
      };
    }

    return {
      routing,
      delegated: false,
      error: routing.error,
    };
  }
}

module.exports = {
  PaymentEvidenceRouter,
  BANK_TRANSFER_METHODS,
  CASH_METHODS,
};
