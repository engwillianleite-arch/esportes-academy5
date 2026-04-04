create table if not exists public.plataforma_configuracoes (
  key text primary key default 'default' check (key = 'default'),
  nome_publico text not null default 'Esportes Academy',
  slug_institucional text not null default 'esportes-academy',
  pais_padrao text not null default 'Brasil',
  idioma_padrao text not null default 'pt-BR',
  cpf_global_obrigatorio boolean not null default true,
  selecao_contexto_obrigatoria boolean not null default true,
  landing_publica_ativa boolean not null default true,
  termos_status text not null default 'Publicado',
  termos_versao text not null default '1.8',
  politica_privacidade_status text not null default 'Publicado',
  politica_privacidade_versao text not null default '1.8',
  politica_cookies_status text not null default 'Em revisao',
  politica_cookies_versao text not null default '1.0',
  email_alertas_operacionais boolean not null default true,
  notif_checkin_checkout boolean not null default true,
  notif_aniversario_padrao boolean not null default true,
  mensagem_aniversario_template text not null default 'Ola Atleta [nome do atleta], hoje e um dia muito especial na sua vida, desejamos muitos anos de vida, muita saude paz e prosperidade. Estes sao os votos da [nome da escola].',
  exigir_reset_senha_internos boolean not null default true,
  mfa_superadmin boolean not null default true,
  sessao_curta_critica boolean not null default false,
  retencao_logs_dias integer not null default 180 check (retencao_logs_dias between 1 and 3650),
  exportacao_auditoria_frequencia text not null default 'Semanal',
  alertas_falha_ativos boolean not null default true,
  canal_escalonamento text not null default 'Suporte interno',
  provider_video_padrao text not null default 'youtube',
  timeout_jobs_segundos integer not null default 45 check (timeout_jobs_segundos between 5 and 600),
  retry_jobs_limite integer not null default 3 check (retry_jobs_limite between 0 and 20),
  rate_limit_janela_segundos integer not null default 60 check (rate_limit_janela_segundos between 1 and 3600),
  eventos_por_lote integer not null default 100 check (eventos_por_lote between 1 and 5000),
  sandbox_cursos_ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at_plataforma_configuracoes
  before update on public.plataforma_configuracoes
  for each row execute function extensions.moddatetime(updated_at);

insert into public.plataforma_configuracoes (key)
values ('default')
on conflict (key) do nothing;
