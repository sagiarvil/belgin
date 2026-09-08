'use strict';

/**
 * BELGİN KUYUMCULUK — NAKİT & BANKA HAVALESİ UYUMLULUK VE MEVZUAT YAPILANDIRMASI
 * VUK Tevsik Zorunluluğu, MASAK 5549 s. Kanun & Yönetmelik Eşikleri
 * 
 * Bu yapılandırma kod içerisine hardcoded gömülmez; effective_date ve versiyon kontrolü ile yönetilir.
 */

const COMPLIANCE_VERSIONS = [
  {
    version: '2026.1',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    description: '2026 Yılı VUK Tevsik Sınırı ve MASAK Kimlik Tespit Eşikleri',
    rules: {
      // VUK Genel Tebliği uyarınca finansal kurumlar kanalıyla tevsik zorunluluğu üst sınırı
      CASH_COUNTER_LEGAL_MAX: 30000.00,
      // Belgin Kuyumculuk iç politika güvenlik marjı (30.000 TL yasal sınırına takılmamak için)
      CASH_COUNTER_POLICY_MAX: 29999.99,
      // MASAK Madde 5 uyarınca kimlik tespiti zorunlu parasal işlem alt sınırı
      MASAK_KYC_THRESHOLD: 185000.00,
      // MASAK Madde 8 ve Yönetmelik uyarınca belge ve kayıt muhafaza süresi (Yıl)
      MASAK_RETENTION_YEARS: 8,
      // GİB Tevsik Zorunluluğu: Aynı gün aynı kişi veya kurumla yapılan işlemler kümülatif takip edilir
      SAME_DAY_COUNTERPARTY_AGGREGATION: true,
      // Taksitli/Parçalı sözleşmelerde toplam bedel tevsik sınırını aşıyorsa her taksit bankadan tahsil edilmelidir
      CONTRACT_TOTAL_THRESHOLD_CHECK: true,
      // Şüpheli İşlem Bildirimi (ŞİB) parasal sınır aranmaksızın değerlendirilir
      SUSPICIOUS_TRANSACTION_NO_LOWER_BOUND: true,
    }
  }
];

function getComplianceConfig(atDate = new Date()) {
  const targetTime = new Date(atDate).getTime();
  const sorted = [...COMPLIANCE_VERSIONS].sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );
  for (const item of sorted) {
    if (new Date(item.effectiveDate).getTime() <= targetTime) {
      return JSON.parse(JSON.stringify(item));
    }
  }
  return JSON.parse(JSON.stringify(sorted[sorted.length - 1]));
}

module.exports = {
  COMPLIANCE_VERSIONS,
  getComplianceConfig,
};
