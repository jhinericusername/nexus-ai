import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Nexus.ai</h1>
          <p className="text-gray-500">
            Your AI-powered notes companion for STEM learning
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/sign-in" className="block">
            <Button className="w-full" variant="default" size="lg">
              Sign In
            </Button>
          </Link>
          
          <Link href="/sign-up" className="block">
            <Button className="w-full" variant="outline" size="lg">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}