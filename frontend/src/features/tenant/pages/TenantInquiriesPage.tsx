import { InquiriesList } from '../../../shared/components/InquiriesList'

export function TenantInquiriesPage() {
  return (
    <InquiriesList
      role="tenant"
      title="我的咨询"
      subtitle="与房东的对话列表"
      chatPath="/tenant/chats"
      queryKey={['tenant', 'inquiries']}
    />
  )
}
