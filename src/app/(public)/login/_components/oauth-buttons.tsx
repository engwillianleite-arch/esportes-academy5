'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type OAuthProvider = 'google' | 'apple'

export function OAuthButtons() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null)

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoading(provider)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error('[oauth] signInWithOAuth error:', error.message)
        setLoading(null)
      }
      // On success, browser navigates away — loading state persists until navigation
    } catch (err) {
      console.error('[oauth] unexpected error:', err)
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading !== null}
        onClick={() => handleOAuth('google')}
      >
        {loading === 'google' ? 'Redirecionando...' : 'Entrar com Google'}
      </Button>

      {/* Apple Sign In — mandatory for iOS App Store compliance (AC#3) */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading !== null}
        onClick={() => handleOAuth('apple')}
      >
        {loading === 'apple' ? 'Redirecionando...' : 'Entrar com Apple'}
      </Button>
    </div>
  )
}
