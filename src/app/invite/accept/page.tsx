import { Suspense } from 'react'
import AcceptInvitationContent from './accept-content'

export default async function AcceptInvitationPage({ 
  searchParams 
}: {
  searchParams: Promise<{ id?: string; token?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  
  return (
    <Suspense fallback={<AcceptInvitationSkeleton />}>
      <AcceptInvitationContent searchParams={resolvedSearchParams} />
    </Suspense>
  )
}

function AcceptInvitationSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-4 w-3/4 mx-auto bg-gray-200 rounded"></div>
          <div className="h-8 w-full bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}
