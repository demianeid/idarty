export const businessTypes = ['salon', 'barbershop', 'gym', 'clinic', 'studio', 'consulting', 'other'] as const

export type BusinessType = (typeof businessTypes)[number]

export const businessTypeLabels: Record<BusinessType, { ar: string; en: string }> = {
  salon: { ar: 'صالون تجميل', en: 'Salon' },
  barbershop: { ar: 'حلاق رجالي', en: 'Barbershop' },
  gym: { ar: 'نادي رياضي', en: 'Gym' },
  clinic: { ar: 'عيادة', en: 'Clinic' },
  studio: { ar: 'استوديو', en: 'Studio' },
  consulting: { ar: 'استشارات', en: 'Consulting' },
  other: { ar: 'نشاط آخر', en: 'Other' },
}

export function isBusinessType(value: unknown): value is BusinessType {
  return typeof value === 'string' && businessTypes.includes(value as BusinessType)
}

export function businessTypeLabel(value: string, locale: 'ar' | 'en') {
  return isBusinessType(value) ? businessTypeLabels[value][locale] : businessTypeLabels.other[locale]
}

export function defaultServicePreset(type: BusinessType) {
  const presets: Record<BusinessType, { durationMin: number; priceAmount: string }> = {
    salon: { durationMin: 60, priceAmount: '450' }, barbershop: { durationMin: 45, priceAmount: '300' }, gym: { durationMin: 60, priceAmount: '250' }, clinic: { durationMin: 30, priceAmount: '500' }, studio: { durationMin: 60, priceAmount: '400' }, consulting: { durationMin: 60, priceAmount: '750' }, other: { durationMin: 30, priceAmount: '0' },
  }
  return presets[type]
}

export function defaultServiceName(type: BusinessType, locale: 'ar' | 'en') {
  const names: Record<BusinessType, { ar: string; en: string }> = {
    salon: { ar: 'جلسة عناية', en: 'Care session' },
    barbershop: { ar: 'قص شعر', en: 'Haircut' },
    gym: { ar: 'جلسة تدريب', en: 'Training session' },
    clinic: { ar: 'استشارة', en: 'Consultation' },
    studio: { ar: 'جلسة خاصة', en: 'Private session' },
    consulting: { ar: 'جلسة استشارية', en: 'Consulting session' },
    other: { ar: 'موعد', en: 'Appointment' },
  }
  return names[type][locale]
}

export function defaultWorkspacePlaceholder(type: BusinessType, locale: 'ar' | 'en') {
  const names: Record<BusinessType, { ar: string; en: string }> = {
    salon: { ar: 'صالون لمسة', en: 'Luma Salon' },
    barbershop: { ar: 'حلاق الأناقة', en: 'The Gentlemen Barbershop' },
    gym: { ar: 'نادي الحركة', en: 'Momentum Gym' },
    clinic: { ar: 'عيادة النور', en: 'Nour Clinic' },
    studio: { ar: 'استوديو إبداع', en: 'Creative Studio' },
    consulting: { ar: 'مكتب رؤية', en: 'Vision Consulting' },
    other: { ar: 'مساحة عملي', en: 'My workspace' },
  }
  return names[type][locale]
}
