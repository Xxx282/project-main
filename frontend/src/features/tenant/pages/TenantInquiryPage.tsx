import { useParams } from 'react-router-dom'
import { InquiryChat } from '../../../shared/components/InquiryChat'

export function TenantInquiryPage() {
  const { id } = useParams()
  const conversationId = Number(id)
  
  return (
    <InquiryChat
      conversationId={conversationId}
      userRole="tenant"
      listPath="/tenant/inquiries"
    />
  )
}
