import Image from 'next/image'
import { Suspense } from 'react'
import { LoginForm } from './_components/login-form'
import { OAuthButtons } from './_components/oauth-buttons'

export const metadata = {
  title: 'Entrar | Esportes Academy',
}

const highlights = [
  'Gestão completa de atletas, matrículas e jornadas',
  'Financeiro integrado, presença, saúde e comunicação',
  'App único com contexto por escola e perfil de acesso',
]

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.22),_transparent_35%),linear-gradient(135deg,#0f2517_0%,#173223_42%,#f5efe0_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,22,15,0.16),rgba(13,22,15,0.42))]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between px-6 pb-8 pt-6 text-white sm:px-10 lg:px-14 lg:py-12">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
              <Image
                src="/esportes-academy-logo.jpg"
                alt="Logo Esportes Academy"
                width={72}
                height={72}
                className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16"
                priority
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-white/70">Esportes Academy</p>
              <h1 className="text-lg font-semibold sm:text-xl">Gestão esportiva com presença de marca</h1>
            </div>
          </div>

          <div className="mt-10 flex-1 lg:mt-16">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.38em] text-amber-200/90">Portal de acesso</p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-balance sm:text-5xl">
                A plataforma que acompanha a jornada completa da escola e do atleta.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
                Entre para continuar operando cursos, check-in, financeiro, saúde e comunicação em um
                só ecossistema.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:mt-10">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-white/14 bg-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                >
                  <div className="mb-3 h-2 w-14 rounded-full bg-amber-300" />
                  <p className="text-sm leading-6 text-white/88">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 hidden overflow-hidden rounded-[2rem] border border-white/14 bg-black/20 shadow-[0_30px_80px_rgba(0,0,0,0.32)] lg:block">
            <Image
              src="/esportes-academy-logo.jpg"
              alt="Marca Esportes Academy no estádio"
              width={768}
              height={768}
              className="h-[320px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.52))]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-amber-200/90">Marca e operação</p>
              <p className="mt-2 max-w-lg text-lg font-medium text-white">
                Uma identidade forte para uma operação esportiva organizada, modular e pronta para crescer.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 pb-10 pt-2 sm:px-10 lg:px-8 lg:py-12">
          <div className="w-full max-w-md rounded-[2rem] border border-white/18 bg-white/92 p-6 shadow-[0_28px_90px_rgba(12,18,14,0.30)] backdrop-blur-2xl sm:p-8">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <Image
                src="/esportes-academy-logo.jpg"
                alt="Logo Esportes Academy"
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl object-cover shadow-sm"
                priority
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Esportes Academy</p>
                <p className="text-sm font-medium text-foreground">Acesse o ambiente da sua escola</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-4 hidden items-center gap-3 lg:flex">
                <Image
                  src="/esportes-academy-logo.jpg"
                  alt="Logo Esportes Academy"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-2xl object-cover shadow-sm"
                  priority
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Esportes Academy</p>
                  <p className="text-sm font-medium text-foreground">Acesso seguro ao ecossistema esportivo</p>
                </div>
              </div>
              <h3 className="text-3xl font-semibold text-foreground">Bem-vindo de volta</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use seu e-mail para entrar e retomar a operação da escola, o acompanhamento dos atletas
                e a jornada do app.
              </p>
            </div>

            <Suspense fallback={<div className="h-[220px]" />}>
              <LoginForm />
            </Suspense>

            <div className="my-5 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-[0.24em]">
                <span className="bg-white px-3 text-muted-foreground">ou continue com</span>
              </div>
            </div>

            <OAuthButtons />

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-950">
              <p className="font-medium">Acesso unificado</p>
              <p className="mt-1 leading-6 text-emerald-900/80">
                O mesmo login pode abrir experiências diferentes conforme sua escola e seu perfil.
              </p>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              Problemas para entrar?{' '}
              <a
                href="mailto:suporte@esportesacademy.com.br"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Contate o suporte
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
