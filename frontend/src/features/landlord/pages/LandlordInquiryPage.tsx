import { useParams } from 'react-router-dom'
import { InquiryChat } from '../../../shared/components/InquiryChat'

export function LandlordInquiryPage() {
  const { id } = useParams()
  const conversationId = Number(id)
  
  return (
    <InquiryChat
      conversationId={conversationId}
      userRole="landlord"
      listPath="/landlord/inquiries"
    />
  )
}
