export type PhoneCategory = 'flagship' | 'camera-pro' | 'foldable';

export interface PricePoint {
  month: string;
  priceUsd: number;
}

export interface ColorwayStudioGrade {
  imgFilter: string;
  tintGradient?: string;
  blendMode?: 'color' | 'soft-light' | 'multiply' | 'screen';
}

export interface PhoneColorway {
  id: string;
  name: string;
  hex: string;
  secondaryHex?: string;
  material: string;
  imageUrl?: string;
  imageAlt?: string;
  studioGrade?: ColorwayStudioGrade;
}

export interface PhoneModel {
  id: string;
  brand: string;
  name: string;
  finish: string;
  colorways: PhoneColorway[];
  category: PhoneCategory;
  categoryLabel: string;
  releaseYear: number;
  releaseDate: string;
  priceUsd: number;
  priceHistory: PricePoint[];
  officialUrl: string;
  imageUrl: string;
  imageAlt: string;
  quickSpecs: {
    display: string;
    chipset: string;
    camera: string;
    battery: string;
    storage: string;
  };
  fullSpecs: {
    displayDetail: string;
    processorDetail: string;
    ram: string;
    storageOptions: string;
    rearCameraDetail: string;
    frontCameraDetail: string;
    batteryDetail: string;
    charging: string;
    chassis: string;
    dimensions: string;
    weight: string;
    connectivity: string;
    os: string;
  };
}

export const PHONE_MODELS: PhoneModel[] = [
  {
    id: 'iphone-16-pro-max',
    brand: 'Apple',
    name: 'iPhone 16 Pro Max',
    finish: 'Natural Titanium',
    colorways: [
      {
        id: 'natural-titanium',
        name: 'Natural Titanium',
        hex: '#9E988D',
        secondaryHex: '#C5C0B6',
        material: 'Brushed Grade 5 Titanium',
        imageUrl: '/src/assets/images/phone_iphone_16_pro_max_1794933043891.jpg',
        imageAlt: 'Apple iPhone 16 Pro Max in Natural Titanium resting on a light neutral stone surface',
      },
      {
        id: 'black-titanium',
        name: 'Black Titanium',
        hex: '#222326',
        secondaryHex: '#43454B',
        material: 'PVD Matte Titanium',
        imageUrl: '/src/assets/images/phone_iphone16_promax_black_1795207357699.jpg',
        imageAlt: 'Apple iPhone 16 Pro Max in Black Titanium with deep matte charcoal back glass on neutral stone',
      },
      {
        id: 'desert-titanium',
        name: 'Desert Titanium',
        hex: '#C5A48A',
        secondaryHex: '#DEC4AF',
        material: 'Warm Anodized Titanium',
        imageUrl: '/src/assets/images/phone_iphone16_promax_desert_1795207356040.jpg',
        imageAlt: 'Apple iPhone 16 Pro Max in Desert Titanium with warm bronze-sand back glass on neutral stone',
      },
      {
        id: 'white-titanium',
        name: 'White Titanium',
        hex: '#EAE8E3',
        secondaryHex: '#D1CFC9',
        material: 'Satin Silver Titanium',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.16) contrast(0.98)',
          tintGradient:
            'radial-gradient(ellipse 68% 58% at 50% 50%, rgba(248, 248, 246, 0.44) 0%, rgba(248, 248, 246, 0.12) 60%, transparent 92%)',
          blendMode: 'screen',
        },
      },
    ],
    category: 'flagship',
    categoryLabel: 'Flagship',
    releaseYear: 2024,
    releaseDate: '2024-09-20',
    priceUsd: 1199,
    priceHistory: [
      { month: 'Jun', priceUsd: 1199 },
      { month: 'Jul', priceUsd: 1199 },
      { month: 'Aug', priceUsd: 1199 },
      { month: 'Sep', priceUsd: 1149 },
      { month: 'Oct', priceUsd: 1149 },
      { month: 'Nov', priceUsd: 1199 },
    ],
    officialUrl: 'https://www.apple.com/iphone-16-pro/',
    imageUrl: '/src/assets/images/phone_iphone_16_pro_max_1794933043891.jpg',
    imageAlt: 'Apple iPhone 16 Pro Max in Natural Titanium resting on a light neutral stone surface',
    quickSpecs: {
      display: '6.9" Super Retina XDR · 120Hz',
      chipset: 'Apple A18 Pro (3nm)',
      camera: '48MP Fusion + 5x Tetraprism',
      battery: '4,685 mAh · 25W MagSafe',
      storage: '256GB – 1TB NVMe',
    },
    fullSpecs: {
      displayDetail: '6.9" LTPO Super Retina XDR OLED, 2868 × 1320, 1–120Hz ProMotion, 2,000 nits peak',
      processorDetail: 'Apple A18 Pro (3nm), 6-core CPU, 6-core GPU, 16-core Neural Engine',
      ram: '8 GB Unified Memory',
      storageOptions: '256 GB / 512 GB / 1 TB',
      rearCameraDetail: '48MP f/1.78 Fusion main + 48MP f/2.2 Ultra Wide + 12MP f/2.8 5x Telephoto',
      frontCameraDetail: '12MP TrueDepth f/1.9 with autofocus',
      batteryDetail: '4,685 mAh Li-Ion',
      charging: 'Up to 30W USB-C wired, 25W MagSafe wireless',
      chassis: 'Grade 5 brushed titanium frame, Ceramic Shield front, IP68',
      dimensions: '163.0 × 77.6 × 8.25 mm',
      weight: '227 g',
      connectivity: '5G sub-6/mmWave, Wi-Fi 7, Bluetooth 5.3, USB 3 (10Gb/s), UWB Gen 2',
      os: 'iOS 18',
    },
  },
  {
    id: 'galaxy-s25-ultra',
    brand: 'Samsung',
    name: 'Galaxy S25 Ultra',
    finish: 'Titanium Gray',
    colorways: [
      {
        id: 'titanium-gray',
        name: 'Titanium Gray',
        hex: '#8C8A83',
        secondaryHex: '#B6B4AC',
        material: 'Brushed Titanium · Gorilla Armor 2',
        imageUrl: '/src/assets/images/phone_galaxy_s25_ultra_1794933044866.jpg',
        imageAlt: 'Samsung Galaxy S25 Ultra in Titanium Gray with matching S Pen stylus on a stone pedestal',
      },
      {
        id: 'titanium-silverblue',
        name: 'Titanium Silverblue',
        hex: '#7A90A8',
        secondaryHex: '#B0C2D4',
        material: 'Cool Anodized Titanium',
        imageUrl: '/src/assets/images/phone_s25_ultra_silverblue_1795207355421.jpg',
        imageAlt: 'Samsung Galaxy S25 Ultra in Titanium Silverblue with matching silver-blue S Pen on stone',
      },
      {
        id: 'titanium-black',
        name: 'Titanium Black',
        hex: '#1E2024',
        secondaryHex: '#3A3D44',
        material: 'Matte Black Titanium',
        studioGrade: {
          imgFilter: 'saturate(0.1) brightness(0.54) contrast(1.24)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(16, 18, 22, 0.45) 0%, rgba(16, 18, 22, 0.14) 62%, transparent 94%)',
          blendMode: 'multiply',
        },
      },
      {
        id: 'titanium-whitesilver',
        name: 'Titanium Whitesilver',
        hex: '#EAECE8',
        secondaryHex: '#CFD3CE',
        material: 'Frosted Pearl Titanium',
        studioGrade: {
          imgFilter: 'saturate(0.1) brightness(1.16) contrast(0.97)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(250, 250, 249, 0.45) 0%, rgba(250, 250, 249, 0.14) 62%, transparent 94%)',
          blendMode: 'screen',
        },
      },
    ],
    category: 'flagship',
    categoryLabel: 'Flagship',
    releaseYear: 2025,
    releaseDate: '2025-02-07',
    priceUsd: 1299,
    priceHistory: [
      { month: 'Jun', priceUsd: 1299 },
      { month: 'Jul', priceUsd: 1299 },
      { month: 'Aug', priceUsd: 1249 },
      { month: 'Sep', priceUsd: 1199 },
      { month: 'Oct', priceUsd: 1249 },
      { month: 'Nov', priceUsd: 1299 },
    ],
    officialUrl: 'https://www.samsung.com/global/galaxy/galaxy-s25-ultra/',
    imageUrl: '/src/assets/images/phone_galaxy_s25_ultra_1794933044866.jpg',
    imageAlt: 'Samsung Galaxy S25 Ultra in Titanium Gray with matching S Pen stylus on a stone pedestal',
    quickSpecs: {
      display: '6.9" Dynamic AMOLED 2X · 120Hz',
      chipset: 'Snapdragon 8 Elite for Galaxy',
      camera: '200MP Quad + 5x Periscope',
      battery: '5,000 mAh · 45W Wired',
      storage: '256GB – 1TB UFS 4.0',
    },
    fullSpecs: {
      displayDetail: '6.9" QHD+ Dynamic LTPO AMOLED 2X, 3120 × 1440, 1–120Hz, 2,600 nits peak',
      processorDetail: 'Qualcomm Snapdragon 8 Elite for Galaxy (3nm), Oryon octa-core',
      ram: '12 GB LPDDR5X',
      storageOptions: '256 GB / 512 GB / 1 TB',
      rearCameraDetail: '200MP f/1.7 main + 50MP Ultra Wide + 10MP 3x + 50MP 5x Periscope',
      frontCameraDetail: '12MP Dual Pixel f/2.2',
      batteryDetail: '5,000 mAh Li-Ion + integrated S Pen',
      charging: '45W wired Super Fast Charging 2.0, 15W Qi2 wireless',
      chassis: 'Titanium frame, Corning Gorilla Armor 2, IP68',
      dimensions: '162.8 × 77.6 × 8.2 mm',
      weight: '218 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, USB-C 3.2, UWB',
      os: 'Android 15 (One UI 7)',
    },
  },
  {
    id: 'pixel-9-pro-xl',
    brand: 'Google',
    name: 'Pixel 9 Pro XL',
    finish: 'Porcelain',
    colorways: [
      {
        id: 'porcelain',
        name: 'Porcelain',
        hex: '#EDE9E0',
        secondaryHex: '#D5CFC3',
        material: 'Silky Matte Glass · Polished Aluminum',
        imageUrl: '/src/assets/images/phone_pixel_9_pro_xl_1794933045124.jpg',
        imageAlt: 'Google Pixel 9 Pro XL in Porcelain finish showing the horizontal metallic camera visor',
      },
      {
        id: 'obsidian',
        name: 'Obsidian',
        hex: '#1E1F23',
        secondaryHex: '#43454C',
        material: 'Deep Matte Obsidian Glass',
        imageUrl: '/src/assets/images/phone_pixel9_proxl_obsidian_1795207357024.jpg',
        imageAlt: 'Google Pixel 9 Pro XL in Obsidian matte black glass with dark aluminum camera visor',
      },
      {
        id: 'hazel',
        name: 'Hazel',
        hex: '#6F776D',
        secondaryHex: '#949B92',
        material: 'Muted Sage Matte Glass',
        studioGrade: {
          imgFilter: 'saturate(0.3) brightness(0.86) contrast(1.06)',
          tintGradient:
            'radial-gradient(ellipse 66% 58% at 50% 50%, rgba(92, 108, 90, 0.72) 0%, rgba(92, 108, 90, 0.28) 58%, transparent 90%)',
          blendMode: 'color',
        },
      },
      {
        id: 'rose-quartz',
        name: 'Rose Quartz',
        hex: '#E2BFC4',
        secondaryHex: '#EFE0E2',
        material: 'Warm Blush Matte Glass',
        studioGrade: {
          imgFilter: 'saturate(0.35) brightness(0.99) contrast(1.02)',
          tintGradient:
            'radial-gradient(ellipse 66% 58% at 50% 50%, rgba(226, 168, 178, 0.72) 0%, rgba(226, 168, 178, 0.25) 58%, transparent 90%)',
          blendMode: 'color',
        },
      },
    ],
    category: 'camera-pro',
    categoryLabel: 'Camera Pro',
    releaseYear: 2024,
    releaseDate: '2024-08-22',
    priceUsd: 1099,
    priceHistory: [
      { month: 'Jun', priceUsd: 1099 },
      { month: 'Jul', priceUsd: 1099 },
      { month: 'Aug', priceUsd: 999 },
      { month: 'Sep', priceUsd: 999 },
      { month: 'Oct', priceUsd: 1049 },
      { month: 'Nov', priceUsd: 1099 },
    ],
    officialUrl: 'https://store.google.com/product/pixel_9_pro',
    imageUrl: '/src/assets/images/phone_pixel_9_pro_xl_1794933045124.jpg',
    imageAlt: 'Google Pixel 9 Pro XL in Porcelain finish showing the horizontal metallic camera visor',
    quickSpecs: {
      display: '6.8" Super Actua OLED · 120Hz',
      chipset: 'Google Tensor G4 (4nm)',
      camera: '50MP Octa PD + 48MP 5x',
      battery: '5,060 mAh · 37W Wired',
      storage: '128GB – 1TB UFS 3.1',
    },
    fullSpecs: {
      displayDetail: '6.8" LTPO Super Actua OLED, 2992 × 1344, 1–120Hz, 3,000 nits peak',
      processorDetail: 'Google Tensor G4 + Titan M2 security coprocessor',
      ram: '16 GB LPDDR5X',
      storageOptions: '128 GB / 256 GB / 512 GB / 1 TB',
      rearCameraDetail: '50MP f/1.68 main + 48MP f/1.7 Ultra Wide + 48MP f/2.8 5x Telephoto',
      frontCameraDetail: '42MP Dual PD f/2.2 ultrawide',
      batteryDetail: '5,060 mAh Li-Ion',
      charging: '37W USB-C PPS wired, 23W Pixel Stand wireless',
      chassis: '100% recycled aluminum frame, Gorilla Glass Victus 2, IP68',
      dimensions: '162.8 × 76.6 × 8.5 mm',
      weight: '221 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, UWB, Thread',
      os: 'Android 15 (7 years OS updates)',
    },
  },
  {
    id: 'oneplus-13',
    brand: 'OnePlus',
    name: 'OnePlus 13',
    finish: 'Midnight Ocean',
    colorways: [
      {
        id: 'midnight-ocean',
        name: 'Midnight Ocean',
        hex: '#1D3658',
        secondaryHex: '#A7B1C0',
        material: 'Microfiber Vegan Leather',
        imageUrl: '/src/assets/images/phone_oneplus_13_1794933046716.jpg',
        imageAlt: 'OnePlus 13 in Midnight Ocean blue vegan leather with circular Hasselblad camera module',
      },
      {
        id: 'arctic-dawn',
        name: 'Arctic Dawn',
        hex: '#EAECEF',
        secondaryHex: '#C8CED6',
        material: 'Frosted Alabaster Glass',
        imageUrl: '/src/assets/images/phone_oneplus13_arctic_1795207356266.jpg',
        imageAlt: 'OnePlus 13 in Arctic Dawn frosted white glass with brushed silver Hasselblad camera module',
      },
      {
        id: 'black-eclipse',
        name: 'Black Eclipse',
        hex: '#1B1C20',
        secondaryHex: '#3B3E46',
        material: 'Brushed Obsidian Glass',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(0.66) contrast(1.22)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(16, 18, 22, 0.42) 0%, rgba(16, 18, 22, 0.12) 60%, transparent 92%)',
          blendMode: 'multiply',
        },
      },
    ],
    category: 'flagship',
    categoryLabel: 'Flagship',
    releaseYear: 2025,
    releaseDate: '2025-01-07',
    priceUsd: 899,
    priceHistory: [
      { month: 'Jun', priceUsd: 899 },
      { month: 'Jul', priceUsd: 899 },
      { month: 'Aug', priceUsd: 849 },
      { month: 'Sep', priceUsd: 849 },
      { month: 'Oct', priceUsd: 879 },
      { month: 'Nov', priceUsd: 899 },
    ],
    officialUrl: 'https://www.oneplus.com/oneplus-13',
    imageUrl: '/src/assets/images/phone_oneplus_13_1794933046716.jpg',
    imageAlt: 'OnePlus 13 in Midnight Ocean blue vegan leather with circular Hasselblad camera module',
    quickSpecs: {
      display: '6.82" ProXDR 2K AMOLED · 120Hz',
      chipset: 'Snapdragon 8 Elite (3nm)',
      camera: '50MP Hasselblad Triple',
      battery: '6,000 mAh · 100W SuperVOOC',
      storage: '256GB – 512GB UFS 4.0',
    },
    fullSpecs: {
      displayDetail: '6.82" 2K LTPO 4.1 AMOLED, 3168 × 1440, 1–120Hz, 4,500 nits peak',
      processorDetail: 'Qualcomm Snapdragon 8 Elite (3nm), Adreno 830 GPU',
      ram: '12 GB / 16 GB LPDDR5X',
      storageOptions: '256 GB / 512 GB',
      rearCameraDetail: '50MP LYT-808 main + 50MP Ultra Wide + 50MP 3x Triprism Periscope (Hasselblad)',
      frontCameraDetail: '32MP IMX615 f/2.4',
      batteryDetail: '6,000 mAh Silicon-Carbon dual-cell',
      charging: '100W SuperVOOC wired (80W US), 50W AirVOOC wireless',
      chassis: 'Microfiber vegan leather back, aluminum frame, IP68 & IP69',
      dimensions: '162.9 × 76.5 × 8.9 mm',
      weight: '210 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, IR Blaster, USB-C 3.2',
      os: 'OxygenOS 15 (Android 15)',
    },
  },
  {
    id: 'galaxy-z-fold6',
    brand: 'Samsung',
    name: 'Galaxy Z Fold6',
    finish: 'Silver Shadow',
    colorways: [
      {
        id: 'silver-shadow',
        name: 'Silver Shadow',
        hex: '#B0B4BC',
        secondaryHex: '#8E939D',
        material: 'Enhanced Armor Aluminum',
        imageUrl: '/src/assets/images/phone_galaxy_z_fold6_1794933046901.jpg',
        imageAlt: 'Samsung Galaxy Z Fold6 partially unfolded showing dual-rail Armor Aluminum hinge and main OLED screen',
      },
      {
        id: 'navy',
        name: 'Navy',
        hex: '#1F3452',
        secondaryHex: '#3D577A',
        material: 'Anodized Deep Navy Frame',
        studioGrade: {
          imgFilter: 'saturate(0.25) brightness(0.76) contrast(1.12)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(30, 62, 112, 0.78) 0%, rgba(30, 62, 112, 0.3) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'pink',
        name: 'Pink',
        hex: '#E6B7C3',
        secondaryHex: '#F3D8DF',
        material: 'Satin Rose Aluminum',
        studioGrade: {
          imgFilter: 'saturate(0.25) brightness(1.01) contrast(1.02)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(232, 160, 182, 0.74) 0%, rgba(232, 160, 182, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'crafted-black',
        name: 'Crafted Black',
        hex: '#1F2024',
        secondaryHex: '#3A3C42',
        material: 'Carbon Patterned Matte',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(0.56) contrast(1.24)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(16, 18, 22, 0.45) 0%, rgba(16, 18, 22, 0.14) 60%, transparent 92%)',
          blendMode: 'multiply',
        },
      },
    ],
    category: 'foldable',
    categoryLabel: 'Foldable',
    releaseYear: 2024,
    releaseDate: '2024-07-24',
    priceUsd: 1899,
    priceHistory: [
      { month: 'Jun', priceUsd: 1899 },
      { month: 'Jul', priceUsd: 1899 },
      { month: 'Aug', priceUsd: 1799 },
      { month: 'Sep', priceUsd: 1699 },
      { month: 'Oct', priceUsd: 1799 },
      { month: 'Nov', priceUsd: 1899 },
    ],
    officialUrl: 'https://www.samsung.com/global/galaxy/galaxy-z-fold6/',
    imageUrl: '/src/assets/images/phone_galaxy_z_fold6_1794933046901.jpg',
    imageAlt: 'Samsung Galaxy Z Fold6 partially unfolded showing dual-rail Armor Aluminum hinge and main OLED screen',
    quickSpecs: {
      display: '7.6" Inner + 6.3" Cover AMOLED',
      chipset: 'Snapdragon 8 Gen 3 for Galaxy',
      camera: '50MP Wide + 3x Telephoto',
      battery: '4,400 mAh · Dual-Rail Hinge',
      storage: '256GB – 1TB UFS 4.0',
    },
    fullSpecs: {
      displayDetail: '7.6" QXGA+ Foldable Dynamic AMOLED 2X (120Hz) + 6.3" Cover AMOLED',
      processorDetail: 'Qualcomm Snapdragon 8 Gen 3 for Galaxy (4nm)',
      ram: '12 GB LPDDR5X',
      storageOptions: '256 GB / 512 GB / 1 TB',
      rearCameraDetail: '50MP f/1.8 OIS main + 12MP f/2.2 Ultra Wide + 10MP 3x Telephoto',
      frontCameraDetail: '10MP cover camera + 4MP under-display inner camera',
      batteryDetail: '4,400 mAh dual-battery architecture',
      charging: '25W wired, 15W wireless, 4.5W reverse wireless',
      chassis: 'Enhanced Armor Aluminum hinge & frame, Gorilla Glass Victus 2, IP48',
      dimensions: '153.5 × 132.6 × 5.6 mm (unfolded)',
      weight: '239 g',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, UWB, Samsung DeX',
      os: 'Android 15 (One UI 7)',
    },
  },
  {
    id: 'xiaomi-15-ultra',
    brand: 'Xiaomi',
    name: 'Xiaomi 15 Ultra',
    finish: 'Silver Chrome',
    colorways: [
      {
        id: 'silver-chrome',
        name: 'Silver Chrome',
        hex: '#C4C7CD',
        secondaryHex: '#28292D',
        material: 'Dual-Tone Glass Fiber & Leather',
        imageUrl: '/src/assets/images/phone_xiaomi_15_ultra_1794933046906.jpg',
        imageAlt: 'Xiaomi 15 Ultra in Silver Chrome and black textured leather with large circular Leica camera ring',
      },
      {
        id: 'matte-black',
        name: 'Matte Black',
        hex: '#1D1E22',
        secondaryHex: '#3C3E44',
        material: 'Textured Charcoal Polymer',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(0.56) contrast(1.22)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(16, 18, 22, 0.48) 0%, rgba(16, 18, 22, 0.16) 60%, transparent 92%)',
          blendMode: 'multiply',
        },
      },
      {
        id: 'classic-white',
        name: 'Classic White',
        hex: '#ECECE8',
        secondaryHex: '#D0D2D6',
        material: 'Matte Ceramic Glass Fiber',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(1.18) contrast(0.97)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(250, 250, 248, 0.46) 0%, rgba(250, 250, 248, 0.15) 60%, transparent 92%)',
          blendMode: 'screen',
        },
      },
    ],
    category: 'camera-pro',
    categoryLabel: 'Camera Pro',
    releaseYear: 2025,
    releaseDate: '2025-03-02',
    priceUsd: 1399,
    priceHistory: [
      { month: 'Jun', priceUsd: 1399 },
      { month: 'Jul', priceUsd: 1399 },
      { month: 'Aug', priceUsd: 1349 },
      { month: 'Sep', priceUsd: 1349 },
      { month: 'Oct', priceUsd: 1299 },
      { month: 'Nov', priceUsd: 1399 },
    ],
    officialUrl: 'https://www.mi.com/global/product/xiaomi-15-ultra/',
    imageUrl: '/src/assets/images/phone_xiaomi_15_ultra_1794933046906.jpg',
    imageAlt: 'Xiaomi 15 Ultra in Silver Chrome and black textured leather with large circular Leica camera ring',
    quickSpecs: {
      display: '6.73" WQHD+ LTPO AMOLED · 120Hz',
      chipset: 'Snapdragon 8 Elite (3nm)',
      camera: '200MP Leica APO Periscope',
      battery: '5,410 mAh · 90W HyperCharge',
      storage: '512GB – 1TB UFS 4.1',
    },
    fullSpecs: {
      displayDetail: '6.73" WQHD+ Micro-Curved LTPO AMOLED, 3200 × 1440, 1–120Hz, 3,200 nits peak',
      processorDetail: 'Qualcomm Snapdragon 8 Elite (3nm), Xiaomi IceLoop cooling',
      ram: '16 GB LPDDR5X',
      storageOptions: '512 GB / 1 TB UFS 4.1',
      rearCameraDetail: '50MP 1-inch LYT-900 main + 200MP 4.3x Leica APO Periscope + 50MP 3x + 50MP UW',
      frontCameraDetail: '32MP f/2.0 4K60',
      batteryDetail: '5,410 mAh Silicon-Carbon Surge battery',
      charging: '90W wired HyperCharge, 80W wireless HyperCharge',
      chassis: 'CNC aluminum frame, dual-tone aerospace glass fiber & textured leather, IP68',
      dimensions: '161.3 × 75.3 × 9.35 mm',
      weight: '229 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 6.0, Dual-frequency GPS, USB-C 3.2 Gen 2',
      os: 'Xiaomi HyperOS 2 (Android 15)',
    },
  },
  {
    id: 'iphone-16',
    brand: 'Apple',
    name: 'iPhone 16',
    finish: 'Ultramarine',
    colorways: [
      {
        id: 'ultramarine',
        name: 'Ultramarine',
        hex: '#4A63D2',
        secondaryHex: '#7A90E8',
        material: 'Color-Infused Matte Glass',
        imageUrl: '/src/assets/images/phone_iphone_16_1795134736908.jpg',
        imageAlt: 'Apple iPhone 16 in Ultramarine blue matte glass resting on a light travertine stone surface',
      },
      {
        id: 'teal',
        name: 'Teal',
        hex: '#599897',
        secondaryHex: '#84B7B5',
        material: 'Color-Infused Matte Glass',
        studioGrade: {
          imgFilter: 'saturate(0.1) brightness(1.03) contrast(1.04)',
          tintGradient:
            'radial-gradient(ellipse 66% 58% at 50% 50%, rgba(56, 146, 144, 0.78) 0%, rgba(56, 146, 144, 0.28) 58%, transparent 90%)',
          blendMode: 'color',
        },
      },
      {
        id: 'pink',
        name: 'Pink',
        hex: '#E6A8C4',
        secondaryHex: '#F3C9DC',
        material: 'Color-Infused Matte Glass',
        studioGrade: {
          imgFilter: 'saturate(0.1) brightness(1.08) contrast(1.02)',
          tintGradient:
            'radial-gradient(ellipse 66% 58% at 50% 50%, rgba(228, 134, 178, 0.78) 0%, rgba(228, 134, 178, 0.28) 58%, transparent 90%)',
          blendMode: 'color',
        },
      },
      {
        id: 'white',
        name: 'White',
        hex: '#F2F2EE',
        secondaryHex: '#D8D8D4',
        material: 'Color-Infused Matte Glass',
        studioGrade: {
          imgFilter: 'saturate(0.06) brightness(1.22) contrast(0.96)',
          tintGradient:
            'radial-gradient(ellipse 66% 58% at 50% 50%, rgba(252, 252, 250, 0.45) 0%, rgba(252, 252, 250, 0.14) 60%, transparent 90%)',
          blendMode: 'screen',
        },
      },
      {
        id: 'black',
        name: 'Black',
        hex: '#202124',
        secondaryHex: '#3E4046',
        material: 'Color-Infused Matte Glass',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(0.55) contrast(1.24)',
          tintGradient:
            'radial-gradient(ellipse 66% 58% at 50% 50%, rgba(16, 18, 22, 0.44) 0%, rgba(16, 18, 22, 0.14) 60%, transparent 90%)',
          blendMode: 'multiply',
        },
      },
    ],
    category: 'flagship',
    categoryLabel: 'Flagship',
    releaseYear: 2024,
    releaseDate: '2024-09-20',
    priceUsd: 799,
    priceHistory: [
      { month: 'Jun', priceUsd: 799 },
      { month: 'Jul', priceUsd: 799 },
      { month: 'Aug', priceUsd: 799 },
      { month: 'Sep', priceUsd: 749 },
      { month: 'Oct', priceUsd: 749 },
      { month: 'Nov', priceUsd: 799 },
    ],
    officialUrl: 'https://www.apple.com/iphone-16/',
    imageUrl: '/src/assets/images/phone_iphone_16_1795134736908.jpg',
    imageAlt: 'Apple iPhone 16 in Ultramarine blue matte glass resting on a light travertine stone surface',
    quickSpecs: {
      display: '6.1" Super Retina XDR · 60Hz',
      chipset: 'Apple A18 (3nm)',
      camera: '48MP Fusion + 12MP UW',
      battery: '3,561 mAh · 25W MagSafe',
      storage: '128GB – 512GB NVMe',
    },
    fullSpecs: {
      displayDetail: '6.1" Super Retina XDR OLED, 2556 × 1179, 60Hz, 2,000 nits peak',
      processorDetail: 'Apple A18 (3nm), 6-core CPU, 5-core GPU, 16-core Neural Engine',
      ram: '8 GB Unified Memory',
      storageOptions: '128 GB / 256 GB / 512 GB',
      rearCameraDetail: '48MP f/1.6 Fusion main (2x optical-quality Telephoto) + 12MP f/2.2 Ultra Wide',
      frontCameraDetail: '12MP TrueDepth f/1.9 with autofocus',
      batteryDetail: '3,561 mAh Li-Ion',
      charging: 'Up to 30W USB-C wired, 25W MagSafe wireless',
      chassis: 'Aerospace-grade aluminum, color-infused matte glass, Ceramic Shield, IP68',
      dimensions: '147.6 × 71.6 × 7.80 mm',
      weight: '170 g',
      connectivity: '5G sub-6/mmWave, Wi-Fi 7, Bluetooth 5.3, USB-C, UWB Gen 2',
      os: 'iOS 18',
    },
  },
  {
    id: 'galaxy-s25',
    brand: 'Samsung',
    name: 'Galaxy S25',
    finish: 'Navy',
    colorways: [
      {
        id: 'navy',
        name: 'Navy',
        hex: '#243957',
        secondaryHex: '#435C82',
        material: 'Frosted Matte Glass · Armor Aluminum',
        imageUrl: '/src/assets/images/phone_galaxy_s25_1795134736291.jpg',
        imageAlt: 'Samsung Galaxy S25 in Navy frosted matte glass resting on a light travertine stone surface',
      },
      {
        id: 'icyblue',
        name: 'Icyblue',
        hex: '#B5CCE0',
        secondaryHex: '#D5E3F0',
        material: 'Frosted Matte Glass · Armor Aluminum',
        studioGrade: {
          imgFilter: 'saturate(0.14) brightness(1.14) contrast(0.99)',
          tintGradient:
            'radial-gradient(ellipse 68% 58% at 50% 50%, rgba(126, 174, 218, 0.72) 0%, rgba(126, 174, 218, 0.25) 58%, transparent 90%)',
          blendMode: 'color',
        },
      },
      {
        id: 'mint',
        name: 'Mint',
        hex: '#B6D8C7',
        secondaryHex: '#D4EBDF',
        material: 'Frosted Matte Glass · Armor Aluminum',
        studioGrade: {
          imgFilter: 'saturate(0.1) brightness(1.14) contrast(1.0)',
          tintGradient:
            'radial-gradient(ellipse 68% 58% at 50% 50%, rgba(114, 184, 152, 0.76) 0%, rgba(114, 184, 152, 0.26) 58%, transparent 90%)',
          blendMode: 'color',
        },
      },
      {
        id: 'silver-shadow',
        name: 'Silver Shadow',
        hex: '#A8ABB2',
        secondaryHex: '#CACDD3',
        material: 'Frosted Matte Glass · Armor Aluminum',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(1.08) contrast(1.03)',
        },
      },
    ],
    category: 'flagship',
    categoryLabel: 'Flagship',
    releaseYear: 2025,
    releaseDate: '2025-02-07',
    priceUsd: 799,
    priceHistory: [
      { month: 'Jun', priceUsd: 799 },
      { month: 'Jul', priceUsd: 799 },
      { month: 'Aug', priceUsd: 749 },
      { month: 'Sep', priceUsd: 699 },
      { month: 'Oct', priceUsd: 749 },
      { month: 'Nov', priceUsd: 799 },
    ],
    officialUrl: 'https://www.samsung.com/global/galaxy/galaxy-s25/',
    imageUrl: '/src/assets/images/phone_galaxy_s25_1795134736291.jpg',
    imageAlt: 'Samsung Galaxy S25 in Navy frosted matte glass resting on a light travertine stone surface',
    quickSpecs: {
      display: '6.2" Dynamic AMOLED 2X · 120Hz',
      chipset: 'Snapdragon 8 Elite for Galaxy',
      camera: '50MP Triple + 3x Telephoto',
      battery: '4,000 mAh · 25W Wired',
      storage: '128GB – 512GB UFS 4.0',
    },
    fullSpecs: {
      displayDetail: '6.2" FHD+ Dynamic LTPO AMOLED 2X, 2340 × 1080, 1–120Hz, 2,600 nits peak',
      processorDetail: 'Qualcomm Snapdragon 8 Elite for Galaxy (3nm), Oryon octa-core',
      ram: '12 GB LPDDR5X',
      storageOptions: '128 GB / 256 GB / 512 GB',
      rearCameraDetail: '50MP f/1.8 OIS main + 12MP Ultra Wide + 10MP 3x Optical Telephoto',
      frontCameraDetail: '12MP Dual Pixel f/2.2',
      batteryDetail: '4,000 mAh Li-Ion',
      charging: '25W wired charging, 15W Qi2 ready wireless',
      chassis: 'Armor Aluminum frame, Corning Gorilla Glass Victus 2, IP68',
      dimensions: '146.9 × 70.5 × 7.2 mm',
      weight: '162 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, USB-C 3.2',
      os: 'Android 15 (One UI 7)',
    },
  },
  {
    id: 'pixel-9',
    brand: 'Google',
    name: 'Pixel 9',
    finish: 'Obsidian',
    colorways: [
      {
        id: 'obsidian',
        name: 'Obsidian',
        hex: '#1F2024',
        secondaryHex: '#41434A',
        material: 'Polished Glass · Satin Aluminum',
        imageUrl: '/src/assets/images/phone_pixel_9_1795134737329.jpg',
        imageAlt: 'Google Pixel 9 in Obsidian matte black glass with horizontal aluminum camera visor on travertine stone',
      },
      {
        id: 'porcelain',
        name: 'Porcelain',
        hex: '#EAE6DE',
        secondaryHex: '#CFCAC0',
        material: 'Warm Ceramic-Tone Glass',
        studioGrade: {
          imgFilter: 'saturate(0.15) brightness(1.22) contrast(0.95)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(244, 240, 232, 0.46) 0%, rgba(244, 240, 232, 0.14) 60%, transparent 92%)',
          blendMode: 'screen',
        },
      },
      {
        id: 'wintergreen',
        name: 'Wintergreen',
        hex: '#B4D4C0',
        secondaryHex: '#D2E7DA',
        material: 'Fresh Sage Glass',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.16) contrast(0.98)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(116, 184, 146, 0.72) 0%, rgba(116, 184, 146, 0.25) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'peony',
        name: 'Peony',
        hex: '#E288A8',
        secondaryHex: '#F2B5CB',
        material: 'Vibrant Satin Pink Glass',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.14) contrast(1.0)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(226, 108, 152, 0.78) 0%, rgba(226, 108, 152, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
    ],
    category: 'flagship',
    categoryLabel: 'Flagship',
    releaseYear: 2024,
    releaseDate: '2024-08-22',
    priceUsd: 799,
    priceHistory: [
      { month: 'Jun', priceUsd: 799 },
      { month: 'Jul', priceUsd: 799 },
      { month: 'Aug', priceUsd: 699 },
      { month: 'Sep', priceUsd: 699 },
      { month: 'Oct', priceUsd: 749 },
      { month: 'Nov', priceUsd: 799 },
    ],
    officialUrl: 'https://store.google.com/product/pixel_9',
    imageUrl: '/src/assets/images/phone_pixel_9_1795134737329.jpg',
    imageAlt: 'Google Pixel 9 in Obsidian matte black glass with horizontal aluminum camera visor on travertine stone',
    quickSpecs: {
      display: '6.3" Actua OLED · 120Hz',
      chipset: 'Google Tensor G4 (4nm)',
      camera: '50MP Octa PD + 48MP UW',
      battery: '4,700 mAh · 27W Wired',
      storage: '128GB – 256GB UFS 3.1',
    },
    fullSpecs: {
      displayDetail: '6.3" Actua OLED, 2424 × 1080, 60–120Hz, 2,700 nits peak',
      processorDetail: 'Google Tensor G4 + Titan M2 security coprocessor',
      ram: '12 GB LPDDR5X',
      storageOptions: '128 GB / 256 GB',
      rearCameraDetail: '50MP f/1.68 Octa PD main + 48MP f/1.7 Quad PD Ultra Wide (Macro Focus)',
      frontCameraDetail: '10.5MP Dual PD f/2.2 with autofocus',
      batteryDetail: '4,700 mAh Li-Ion',
      charging: '27W USB-C PPS wired, 15W Qi wireless',
      chassis: '100% recycled aluminum frame, Gorilla Glass Victus 2, IP68',
      dimensions: '152.8 × 72.0 × 8.5 mm',
      weight: '198 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, Dual-band GNSS',
      os: 'Android 15 (7 years OS updates)',
    },
  },
  {
    id: 'galaxy-z-flip6',
    brand: 'Samsung',
    name: 'Galaxy Z Flip6',
    finish: 'Mint',
    colorways: [
      {
        id: 'mint',
        name: 'Mint',
        hex: '#B3D8C6',
        secondaryHex: '#8FBAA5',
        material: 'Matte Glass · Armor Aluminum',
        imageUrl: '/src/assets/images/phone_galaxy_z_flip6_1795134736978.jpg',
        imageAlt: 'Samsung Galaxy Z Flip6 clamshell foldable in Mint green partially folded on a travertine pedestal',
      },
      {
        id: 'blue',
        name: 'Blue',
        hex: '#7BA5D6',
        secondaryHex: '#5982B3',
        material: 'Matte Glass · Armor Aluminum',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.02) contrast(1.04)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(86, 144, 208, 0.78) 0%, rgba(86, 144, 208, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'yellow',
        name: 'Yellow',
        hex: '#ECD888',
        secondaryHex: '#D8C068',
        material: 'Matte Glass · Armor Aluminum',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.06) contrast(1.03)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(224, 194, 84, 0.78) 0%, rgba(224, 194, 84, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'silver-shadow',
        name: 'Silver Shadow',
        hex: '#ACAFB5',
        secondaryHex: '#8B8E95',
        material: 'Matte Glass · Armor Aluminum',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(0.98) contrast(1.06)',
        },
      },
    ],
    category: 'foldable',
    categoryLabel: 'Foldable',
    releaseYear: 2024,
    releaseDate: '2024-07-24',
    priceUsd: 1099,
    priceHistory: [
      { month: 'Jun', priceUsd: 1099 },
      { month: 'Jul', priceUsd: 1099 },
      { month: 'Aug', priceUsd: 999 },
      { month: 'Sep', priceUsd: 949 },
      { month: 'Oct', priceUsd: 999 },
      { month: 'Nov', priceUsd: 1099 },
    ],
    officialUrl: 'https://www.samsung.com/global/galaxy/galaxy-z-flip6/',
    imageUrl: '/src/assets/images/phone_galaxy_z_flip6_1795134736978.jpg',
    imageAlt: 'Samsung Galaxy Z Flip6 clamshell foldable in Mint green partially folded on a travertine pedestal',
    quickSpecs: {
      display: '6.7" Foldable + 3.4" Cover',
      chipset: 'Snapdragon 8 Gen 3 for Galaxy',
      camera: '50MP Wide + 12MP UW',
      battery: '4,000 mAh · FlexHinge',
      storage: '256GB – 512GB UFS 4.0',
    },
    fullSpecs: {
      displayDetail: '6.7" FHD+ Foldable Dynamic AMOLED 2X (1–120Hz) + 3.4" Super AMOLED FlexWindow',
      processorDetail: 'Qualcomm Snapdragon 8 Gen 3 for Galaxy (4nm) with vapor chamber',
      ram: '12 GB LPDDR5X',
      storageOptions: '256 GB / 512 GB',
      rearCameraDetail: '50MP f/1.8 OIS Dual Pixel main + 12MP f/2.2 Ultra Wide',
      frontCameraDetail: '10MP f/2.2 cover selfie / FlexCam',
      batteryDetail: '4,000 mAh dual-cell battery',
      charging: '25W wired charging, 15W wireless, 4.5W reverse wireless',
      chassis: 'Enhanced Armor Aluminum frame, Gorilla Glass Victus 2, IP48',
      dimensions: '165.1 × 71.9 × 6.9 mm (unfolded)',
      weight: '187 g',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C 3.2',
      os: 'Android 15 (One UI 7)',
    },
  },
  {
    id: 'motorola-razr-plus-2024',
    brand: 'Motorola',
    name: 'Razr+ (2024)',
    finish: 'Midnight Blue',
    colorways: [
      {
        id: 'midnight-blue',
        name: 'Midnight Blue',
        hex: '#1D334D',
        secondaryHex: '#355478',
        material: 'Textured Vegan Leather',
        imageUrl: '/src/assets/images/phone_motorola_razr_plus_1795134736693.jpg',
        imageAlt: 'Motorola Razr+ in Midnight Blue vegan leather partially unfolded displaying its edge-to-edge external screen',
      },
      {
        id: 'spring-green',
        name: 'Spring Green',
        hex: '#7FB866',
        secondaryHex: '#9FCE8A',
        material: 'Textured Vegan Leather',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.08) contrast(1.03)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(108, 178, 86, 0.78) 0%, rgba(108, 178, 86, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'peach-fuzz',
        name: 'Peach Fuzz',
        hex: '#EDAC92',
        secondaryHex: '#F5C9B6',
        material: 'Pantone Vegan Leather',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.12) contrast(1.0)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(235, 148, 114, 0.78) 0%, rgba(235, 148, 114, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'hot-pink',
        name: 'Hot Pink',
        hex: '#D6427C',
        secondaryHex: '#EC75A3',
        material: 'Textured Vegan Leather',
        studioGrade: {
          imgFilter: 'saturate(0.12) brightness(1.02) contrast(1.06)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(214, 66, 124, 0.78) 0%, rgba(214, 66, 124, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
    ],
    category: 'foldable',
    categoryLabel: 'Foldable',
    releaseYear: 2024,
    releaseDate: '2024-07-24',
    priceUsd: 999,
    priceHistory: [
      { month: 'Jun', priceUsd: 999 },
      { month: 'Jul', priceUsd: 949 },
      { month: 'Aug', priceUsd: 899 },
      { month: 'Sep', priceUsd: 799 },
      { month: 'Oct', priceUsd: 849 },
      { month: 'Nov', priceUsd: 999 },
    ],
    officialUrl: 'https://www.motorola.com/us/smartphones-razr-plus-gen-2/p',
    imageUrl: '/src/assets/images/phone_motorola_razr_plus_1795134736693.jpg',
    imageAlt: 'Motorola Razr+ in Midnight Blue vegan leather partially unfolded displaying its edge-to-edge external screen',
    quickSpecs: {
      display: '6.9" pOLED + 4.0" External',
      chipset: 'Snapdragon 8s Gen 3 (4nm)',
      camera: '50MP Main + 50MP 2x Telephoto',
      battery: '4,000 mAh · 45W TurboPower',
      storage: '256GB UFS 4.0',
    },
    fullSpecs: {
      displayDetail: '6.9" FHD+ LTPO pOLED (165Hz) + 4.0" LTPO pOLED external display (165Hz)',
      processorDetail: 'Qualcomm Snapdragon 8s Gen 3 (4nm), Adreno 735 GPU',
      ram: '12 GB LPDDR5X',
      storageOptions: '256 GB UFS 4.0',
      rearCameraDetail: '50MP f/1.7 OIS main + 50MP f/2.0 2x Optical Telephoto',
      frontCameraDetail: '32MP f/2.4 internal camera',
      batteryDetail: '4,000 mAh Li-Ion',
      charging: '45W TurboPower wired, 15W wireless, 5W reverse wireless',
      chassis: 'Textured vegan leather, 6000-series aluminum frame, Gorilla Glass Victus, IPX8',
      dimensions: '171.4 × 74.0 × 7.09 mm (unfolded)',
      weight: '189 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, eSIM + Nano SIM',
      os: 'Android 15 (Hello UI)',
    },
  },
  {
    id: 'vivo-x200-pro',
    brand: 'vivo',
    name: 'X200 Pro',
    finish: 'Titanium Grey',
    colorways: [
      {
        id: 'titanium-grey',
        name: 'Titanium Grey',
        hex: '#7C7C7A',
        secondaryHex: '#A2A29E',
        material: 'Brushed Aluminum & Armor Glass',
        imageUrl: '/src/assets/images/phone_vivo_x200_pro_1795134736780.jpg',
        imageAlt: 'vivo X200 Pro in brushed Titanium Grey highlighting its large circular ZEISS optical camera module',
      },
      {
        id: 'titanium-blue',
        name: 'Titanium Blue',
        hex: '#3A5E86',
        secondaryHex: '#6388B0',
        material: 'Anodized Titanium Blue Glass',
        studioGrade: {
          imgFilter: 'saturate(0.18) brightness(0.98) contrast(1.06)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(52, 102, 160, 0.78) 0%, rgba(52, 102, 160, 0.28) 58%, transparent 92%)',
          blendMode: 'color',
        },
      },
      {
        id: 'carbon-black',
        name: 'Carbon Black',
        hex: '#1D1E21',
        secondaryHex: '#3A3C42',
        material: 'Satin Matte Carbon Glass',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(0.56) contrast(1.22)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(16, 18, 22, 0.45) 0%, rgba(16, 18, 22, 0.14) 60%, transparent 92%)',
          blendMode: 'multiply',
        },
      },
      {
        id: 'moonlight-white',
        name: 'Moonlight White',
        hex: '#ECECE8',
        secondaryHex: '#D2D3CE',
        material: 'Frosted Pearl Glass',
        studioGrade: {
          imgFilter: 'saturate(0.08) brightness(1.18) contrast(0.97)',
          tintGradient:
            'radial-gradient(ellipse 68% 60% at 50% 50%, rgba(250, 250, 248, 0.46) 0%, rgba(250, 250, 248, 0.14) 60%, transparent 92%)',
          blendMode: 'screen',
        },
      },
    ],
    category: 'camera-pro',
    categoryLabel: 'Camera Pro',
    releaseYear: 2024,
    releaseDate: '2024-11-22',
    priceUsd: 1149,
    priceHistory: [
      { month: 'Jun', priceUsd: 1149 },
      { month: 'Jul', priceUsd: 1149 },
      { month: 'Aug', priceUsd: 1099 },
      { month: 'Sep', priceUsd: 1049 },
      { month: 'Oct', priceUsd: 1099 },
      { month: 'Nov', priceUsd: 1149 },
    ],
    officialUrl: 'https://www.vivo.com/en/products/x200-pro',
    imageUrl: '/src/assets/images/phone_vivo_x200_pro_1795134736780.jpg',
    imageAlt: 'vivo X200 Pro in brushed Titanium Grey highlighting its large circular ZEISS optical camera module',
    quickSpecs: {
      display: '6.78" 8T LTPO AMOLED · 120Hz',
      chipset: 'Dimensity 9400 (3nm)',
      camera: '200MP ZEISS APO Telephoto',
      battery: '6,000 mAh · 90W FlashCharge',
      storage: '256GB – 1TB UFS 4.0',
    },
    fullSpecs: {
      displayDetail: '6.78" 8T LTPO AMOLED, 2800 × 1260, 0.1–120Hz, 4,500 nits local peak',
      processorDetail: 'MediaTek Dimensity 9400 (3nm) + vivo V3+ custom imaging chip',
      ram: '16 GB LPDDR5X',
      storageOptions: '256 GB / 512 GB / 1 TB',
      rearCameraDetail: '50MP Sony LYT-818 main + 200MP ZEISS APO 3.7x Periscope + 50MP Ultra Wide',
      frontCameraDetail: '32MP f/2.0 ultrawide',
      batteryDetail: '6,000 mAh Silicon-Anode semi-solid battery',
      charging: '90W wired FlashCharge, 30W wireless FlashCharge',
      chassis: 'Brushed aluminum alloy frame, Armor Glass, IP68 & IP69',
      dimensions: '162.4 × 76.0 × 8.49 mm',
      weight: '223 g',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, IR Blaster, USB-C 3.2',
      os: 'Funtouch OS 15 (Android 15)',
    },
  },
];
