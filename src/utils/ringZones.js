const normalize = (value = '') => value.trim().toLowerCase();

const ringMapping = [
  {
    ring: 'Ring-I',
    label: 'Muara Lapao-pao, Lapao-pao, Samaenre, Ponre, Uluwolo, Wolo',
    keywords: [
      'muara lapao-pao',
      'muara lapaopao',
      'lapao-pao',
      'lapaopao',
      'samaenre',
      'samaene',
      'ponre',
      'uluwolo',
      'ulu wolo',
      'wolo',
    ],
  },
  {
    ring: 'Ring-II',
    label: 'Donggala, Ulu Lapao-pao, Laggomali, Lalonggopi, Iwoimopuro, Lalonaha, Lana, Ulu Rina',
    keywords: [
      'donggala',
      'ulu lapao-pao',
      'ulu lapaopao',
      'langgomali',
      'lalonggopi',
      'iwoimopuro',
      'iwomopuro',
      'lalonaha',
      'lana',
      'ulu rina',
      'ulurina',
    ],
  },
  {
    ring: 'Ring-III',
    label: 'Kabupaten Kolaka',
    keywords: ['kabupaten kolaka', 'kolaka'],
  },
];

export function determineRing(location = {}) {
  const {
    provinsi = '',
    kabupaten = '',
    kecamatan = '',
    desa = '',
  } = location;

  const normalized = {
    provinsi: normalize(provinsi),
    kabupaten: normalize(kabupaten),
    kecamatan: normalize(kecamatan),
    desa: normalize(desa),
  };

  const matchKeyword = (keywords) =>
    keywords.some(
      (keyword) =>
        (normalized.desa && normalized.desa.includes(keyword)) ||
        (normalized.kecamatan && normalized.kecamatan.includes(keyword)) ||
        (normalized.kabupaten && normalized.kabupaten.includes(keyword))
    );

  for (const mapping of ringMapping) {
    if (matchKeyword(mapping.keywords)) {
      return `${mapping.ring} - ${mapping.label}`;
    }
  }

  if (normalized.kabupaten?.includes('kolaka') || normalized.provinsi?.includes('kolaka')) {
    return 'Ring-III - Kabupaten Kolaka';
  }

  if (normalized.provinsi?.includes('sulawesi')) {
    return 'Ring-IV - Sulawesi Tenggara & Provinsi Sulawesi Lainnya';
  }

  if (provinsi) {
    return `Ring-V - ${provinsi}`;
  }

  return 'Ring-V - Indonesia';
}

