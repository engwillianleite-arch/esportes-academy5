'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MODULO_INFO, MODULO_PATH } from '@/lib/modulo-info'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ModuloStatusItem } from '@/lib/modulo-info'

type Props = {
  item: ModuloStatusItem
}

export function ModuloNavItem({ item }: Props) {
  const [open, setOpen] = useState(false)
  const info = MODULO_INFO[item.slug]

  if (item.status === 'active') {
    return (
      <Link href={`/painel/${MODULO_PATH[item.slug]}`}>
        <div className="flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
          <span className="text-sm font-medium">{info.label}</span>
        </div>
      </Link>
    )
  }

  if (item.status === 'locked-permission') {
    return (
      <div className="flex flex-col gap-1 rounded-lg border p-4 opacity-50 cursor-not-allowed">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{info.label}</span>
          <span className="text-base">🚫</span>
        </div>
        <span className="text-xs text-muted-foreground">Sem permissão</span>
      </div>
    )
  }

  // locked-plan
  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left">
        <div className="flex flex-col gap-1 rounded-lg border p-4 opacity-60 transition-colors hover:bg-accent cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{info.label}</span>
            <span className="text-base">🔒</span>
          </div>
          <span className="text-xs text-muted-foreground capitalize">{info.minPlan}+</span>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <DialogTitle>{info.label}</DialogTitle>
            </div>
            <DialogDescription>{info.description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Disponível no plano</span>
            <Badge variant="secondary" className="capitalize">{info.minPlan}</Badge>
          </div>
          <DialogFooter showCloseButton>
            <a
              href="mailto:contato@esportesacademy.com.br"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Falar com comercial
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
