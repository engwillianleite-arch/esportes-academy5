import { NextRequest, NextResponse } from 'next/server'
import { enqueueAniversariantesHoje } from '@/lib/notification-actions'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { escolaId?: string; referenceDate?: string }
    | null

  const result = await enqueueAniversariantesHoje({
    escolaId: body?.escolaId,
    referenceDate: body?.referenceDate,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, queued: result.queued ?? 0 })
}
