import { redirect } from 'next/navigation'

export default async function EditRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/subscribers/${id}`)
}
