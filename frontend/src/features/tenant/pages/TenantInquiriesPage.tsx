import { InquiriesList } from '../../../shared/components/InquiriesList'
import { useTranslation } from 'react-i18next'

export function TenantInquiriesPage() {
  const { t } = useTranslation()
  return (
    <InquiriesList
      role="tenant"
      title={t('pages.myInquiries')}
      subtitle={t('pages.myInquiriesSubtitle')}
      chatPath="/tenant/chats"
      queryKey={['tenant', 'inquiries']}
    />
  )
}
