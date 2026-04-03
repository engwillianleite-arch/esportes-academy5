import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  getEscolaContext,
  clearEscolaCookiesOnly,
  selectEscola,
} from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listarContextosUsuarioAtual, syncUsuarioEscolaTiposAtual } from '@/lib/usuario-contexto'
import { getRouteForPerfil } from '@/lib/perfil-route'

async function isSuperAdminUser(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('plataforma_usuarios')
    .select('ativo, deleted_at')
    .eq('user_id', userId)
    .maybeSingle()
  return !!(data?.ativo && !data.deleted_at)
}

const pillars = [
  'Gestão de atletas, matrículas, saúde, acessos e financeiro.',
  'App único com contexto por escola e perfil de usuário.',
  'Cursos, comunicação e operação modular para crescimento da escola.',
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.18),_transparent_34%),linear-gradient(135deg,#102617_0%,#193526_46%,#f4ecdd_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,12,8,0.12),rgba(7,12,8,0.42))]" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/esportes-academy-logo.jpg"
                alt="Logo Esportes Academy"
                width={68}
                height={68}
                className="h-14 w-14 rounded-2xl object-cover shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:h-16 sm:w-16"
                priority
              />
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/65">Esportes Academy</p>
                <p className="text-sm font-medium text-white">Plataforma esportiva para escolas e jornadas do atleta</p>
              </div>
            </div>
            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/18"
            >
              Entrar
            </Link>
          </header>

          <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-white">
              <p className="text-sm uppercase tracking-[0.38em] text-amber-200/90">Ecossistema esportivo</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-balance sm:text-5xl lg:text-6xl">
                Uma presença mais forte para a gestão diária da sua escola.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
                Organize pessoas, acessos, cursos, financeiro e comunicação em uma experiência única,
                preparada para acompanhar a evolução da escola e da jornada do atleta.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-[#1e2717] transition hover:bg-amber-200"
                >
                  Acessar plataforma
                </Link>
                <a
                  href="mailto:suporte@esportesacademy.com.br"
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/18"
                >
                  Falar com suporte
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {pillars.map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-white/14 bg-white/10 p-5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
                  >
                    <div className="mb-3 h-2 w-14 rounded-full bg-amber-300" />
                    <p className="text-sm leading-6 text-white/86">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-black/20 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
              <Image
                src="/esportes-academy-logo.jpg"
                alt="Marca Esportes Academy"
                width={768}
                height={768}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (await isSuperAdminUser(user.id)) {
    redirect('/superadmin')
  }

  await syncUsuarioEscolaTiposAtual()

  const ctx = await getEscolaContext()

  if (ctx) {
    const contextosResult = await listarContextosUsuarioAtual()
    const contextos = contextosResult.rows ?? []
    const valid = contextos.some(
      (item) => item.escola_id === ctx.escolaId && item.tipo_usuario === ctx.perfil
    )

    if (valid) redirect(getRouteForPerfil(ctx.perfil))

    await clearEscolaCookiesOnly()

    if (contextos.length === 1) {
      await selectEscola(contextos[0].escola_id, contextos[0].tipo_usuario)
    }
    redirect('/selecionar-escola')
  }

  const contextosResult = await listarContextosUsuarioAtual()
  const contextos = contextosResult.rows ?? []

  if (contextos.length === 1) {
    await selectEscola(contextos[0].escola_id, contextos[0].tipo_usuario)
  }

  redirect('/selecionar-escola')
}
