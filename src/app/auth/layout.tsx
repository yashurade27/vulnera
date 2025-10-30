import React from 'react'

export const metadata = {
  title: 'Vulnera - Authentication',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center justify-center py-12">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  )
}
