import { InquiriesList } from '../../../shared/components/InquiriesList'

export function LandlordInquiriesPage() {
  return (
    <InquiriesList
      role="landlord"
      title="咨询管理"
      subtitle="与租客的对话列表"
      chatPath="/landlord/inquiries"
      queryKey={['landlord', 'inquiries']}
    />
  )
}
