import { redirect } from 'next/navigation'

export default async function ReceiptsRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/subscribers/${id}`)
}
