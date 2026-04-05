import type { Metadata } from 'next'
import ResetPasswordForm from './reset-password-form'

export const metadata: Metadata = {
  title: 'Definir senha | Esportes Academy',
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#ffffff_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto grid min-h-[80vh] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden rounded-[32px] border border-white/60 bg-slate-950 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] lg:block">
          <p className="text-xs uppercase tracking-[0.34em] text-white/60">Esportes Academy</p>
          <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight">
            Primeiro acesso da escola, com senha definida em uma etapa clara.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
            Depois de confirmar sua senha, seguimos automaticamente para o login e para a continuidade da
            configuração da unidade.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold">Fluxo esperado</p>
              <ol className="mt-3 space-y-2 text-sm text-white/72">
                <li>1. Abrir o convite recebido por e-mail</li>
                <li>2. Definir uma senha segura</li>
                <li>3. Continuar para concluir o cadastro e acessar a escola</li>
              </ol>
            </div>
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
              O convite da escola deve sempre apontar para o domínio público da plataforma, nunca para ambiente local.
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Esportes Academy</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Definir senha</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Finalize seu primeiro acesso criando a senha que será usada para entrar e administrar a escola.
            </p>
          </div>

          <ResetPasswordForm />
        </section>
      </div>
    </main>
  )
}
