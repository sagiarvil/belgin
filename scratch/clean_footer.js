const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);

const ALL_PRODUCTS_LIST = PRODUCTS;

const CERTIFICATE_DB = {
  "WDA2114": {
    "brand": "TAG Heuer",
    "model": "Carrera Date Twin-Time",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "TAG-WDA-2114",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "CBN2A1AA": {
    "brand": "TAG Heuer",
    "model": "Carrera Chronograph 44mm",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "TAG-CBN-0643",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "CAZ101N": {
    "brand": "TAG Heuer",
    "model": "Formula 1 Gulf Edition",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "TAG-CAZ-8243",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "WAZ1110": {
    "brand": "TAG Heuer",
    "model": "Formula 1 Date 41mm",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "TAG-WAZ-8023",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "L3.781.4": {
    "brand": "Longines",
    "model": "HydroConquest Seramik 41mm",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "LNG-3781-566",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "L2.909.4": {
    "brand": "Longines",
    "model": "Master Collection Moonphase",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "LNG-2909-783",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "R32105353": {
    "brand": "Rado",
    "model": "Captain Cook Yeşil Seramik",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "RDO-3210-5353",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "R27086162": {
    "brand": "Rado",
    "model": "True Square İskelet",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "RDO-2708-6162",
    "expert": "İzmir Kuyumcular Odası Tescilli Ekspertiz"
  },
  "B6065818": {
    "brand": "Cartier",
    "model": "Juste un Clou Pırlantalı",
    "authStatus": "%100 Orijinal Tescilli",
    "certNo": "CRT-JUC-3301",
    "expert": "GIA Sertifikalı Gemolog İncelemesi"
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRODUCTS,
    WATCH_BRANDS,
    JEWELRY_BRANDS,
    WATCHES,
    JEWELLERY,
    PRE_OWNED_ITEMS,
    PRE_OWNED_GOLD,
    CERTIFICATE_DB,
    ALL_PRODUCTS: PRODUCTS
  };
}
