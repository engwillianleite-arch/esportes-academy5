import type { Metadata } from 'next'
import ResetPasswordForm from '@/app/reset-password/reset-password-form'

export const metadata: Metadata = {
  title: 'Primeiro acesso | Esportes Academy',
}

export default function PrimeiroAcessoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_34%),radial-gradient(circle_at_right,_rgba(59,130,246,0.1),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_46%,#ffffff_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[84vh] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden rounded-[32px] border border-slate-900/10 bg-slate-950 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.3)] lg:block">
          <p className="text-xs uppercase tracking-[0.34em] text-white/60">Primeiro acesso</p>
          <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight">
            Sua escola ja esta pronta. Agora vamos definir a senha e concluir sua entrada.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
            Este fluxo foi criado para novos gestores convidados pelo SuperAdmin. Primeiro voce define sua senha,
            depois seguimos para completar seu cadastro e liberar o acesso da escola.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold">Etapas do primeiro acesso</p>
              <ol className="mt-3 space-y-2 text-sm text-white/72">
                <li>1. Definir uma senha segura</li>
                <li>2. Confirmar seu nome e CPF</li>
                <li>3. Entrar na escola e finalizar as configuracoes</li>
              </ol>
            </div>
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
              Se este convite foi aberto no dispositivo errado, pare aqui e abra novamente a partir do e-mail do
              gestor da escola.
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Esportes Academy</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Defina sua senha inicial</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Depois desta etapa, seguimos automaticamente para completar seu cadastro e liberar o acesso da unidade.
            </p>
          </div>

          <ResetPasswordForm
            successRedirectTo="/completar-cadastro"
            submitLabel="Salvar senha e seguir"
            helperText="Assim que a senha for salva, vamos continuar com a identificacao do usuario e a entrada na escola."
            successMessage="Senha definida com sucesso. Vamos continuar seu primeiro acesso."
          />
        </section>
      </div>
    </main>
  )
}
