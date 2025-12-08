'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  fallbackUrl?: string // para quando não existir histórico
  label?: string
  className?: string
}

export default function BackButton({
  fallbackUrl = '/',
  label = 'Voltar',
  className = '',
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-xl
        bg-white/20 backdrop-blur-sm
        border border-white/30
        text-white font-semibold
        hover:bg-white/30 transition-all
        ${className}
      `}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}
