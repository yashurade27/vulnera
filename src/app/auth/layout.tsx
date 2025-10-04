import React from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata = {
  title: 'Vulnera - Authentication',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-25 py-10 flex items-center justify-center">{children}</main>
      <Footer />
    </div>
  )
}
