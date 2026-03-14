import { InquiriesList } from '../../../shared/components/InquiriesList'
import { useTranslation } from 'react-i18next'

export function LandlordInquiriesPage() {
  const { t } = useTranslation()
  return (
    <InquiriesList
      role="landlord"
      title={t('pages.landlordInquiries')}
      subtitle={t('pages.landlordInquiriesSubtitle')}
      chatPath="/landlord/inquiries"
      queryKey={['landlord', 'inquiries']}
    />
  )
}
