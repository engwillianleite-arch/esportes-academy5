import { Suspense } from 'react'
import { LoginForm } from './_components/login-form'
import { OAuthButtons } from './_components/oauth-buttons'

export const metadata = {
  title: 'Entrar — Esportes Academy',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden below lg breakpoint (UX-DR3, UX-DR11) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center gap-8 bg-[#20c997] p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="mb-6 text-5xl font-bold">EA</div>
          <h1 className="mb-2 text-3xl font-bold">Esportes Academy</h1>
          <p className="text-lg opacity-90">
            Plataforma SaaS para gestão de escolas esportivas
          </p>
        </div>
        <ul className="max-w-xs space-y-3 text-sm opacity-90">
          <li className="flex items-center gap-2">
            <span>✓</span> Gestão completa de atletas e matrículas
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span> Controle financeiro integrado com Asaas
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span> Frequência e aulas em tempo real
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span> App unico com acesso por perfil
          </li>
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo — shown only below lg */}
          <div className="text-center lg:hidden">
            <div className="text-3xl font-bold text-[#20c997]">EA</div>
            <p className="mt-1 text-sm text-muted-foreground">Esportes Academy</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com sua conta para continuar
            </p>
          </div>

          <Suspense fallback={<div className="h-[180px]" />}>
            <LoginForm />
          </Suspense>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <OAuthButtons />

          <p className="text-center text-xs text-muted-foreground">
            Problemas para entrar?{' '}
            <a href="mailto:suporte@esportesacademy.com.br" className="underline hover:text-foreground">
              Contate o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
