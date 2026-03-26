/**
 * escola-sidebar.js
 * Menu lateral compartilhado para todas as telas do Portal Escola.
 *
 * Como usar em cada tela HTML:
 *   1. Adicione antes de </body>:
 *      <script>window.ESCOLA_PAGE = 'presencas';</script>
 *      <script src="escola-sidebar.js"></script>
 *   2. O sidebar deve ter a estrutura:
 *      <aside class="sidebar" id="sidebar">
 *        <!-- logo/chip aqui se quiser manter estático -->
 *        <nav class="sidebar-nav" id="sidebar-nav"></nav>
 *        <div class="sidebar-footer">
 *          <div class="user-row">
 *            <div class="user-ava" id="sidebarAva">AD</div>
 *            <div class="user-info">
 *              <div class="u-name" id="sidebarName">Admin Escola</div>
 *              <div class="u-role" id="sidebarRole">admin_escola</div>
 *            </div>
 *          </div>
 *        </div>
 *      </aside>
 */

// ─── Nav definition ──────────────────────────────────────────────────────────
// lock: 'Pro' | 'Enterprise' | null
// badge: number (notification count) | null
const ESCOLA_NAV_ITEMS = [
  { section: 'Principal' },
  { id: 'dashboard',     label: 'Dashboard',            icon: '📊', href: 'Escola-dashboard.html'        },
  { id: 'atletas',       label: 'Atletas',               icon: '👥', href: 'Escola-atletas.html'           },
  { id: 'grupos',        label: 'Turmas',                icon: '🏃', href: 'Escola-grupos.html'            },
  { id: 'presencas',     label: 'Presenças',             icon: '✅', href: 'Escola-presencas.html'         },

  { section: 'Financeiro' },
  { id: 'financeiro',    label: 'Cobranças',             icon: '💰', href: 'Escola-financeiro.html'        },
  { id: 'planos',        label: 'Planos de Pagamento',   icon: '📋', href: 'Escola-planos-pagamento.html'  },

  { section: 'Módulos' },
  { id: 'saude',         label: 'Saúde',                 icon: '🏥', href: '#', lock: 'Pro'        },
  { id: 'eventos',       label: 'Eventos',               icon: '🎪', href: '#', lock: 'Pro'        },
  { id: 'treinamentos',  label: 'Treinamentos',          icon: '🎯', href: '#', lock: 'Pro'        },
  { id: 'competicoes',   label: 'Competições',           icon: '🏆', href: '#', lock: 'Enterprise' },
  { id: 'relatorios',    label: 'Relatórios',            icon: '📈', href: '#', lock: 'Pro'        },

  { section: 'Escola' },
  { id: 'comunicacao',   label: 'Comunicação',           icon: '💬', href: '#'                             },
  { id: 'configuracoes', label: 'Configurações',         icon: '⚙️', href: 'Escola-configuracoes.html'    },
  { id: 'usuarios',      label: 'Usuários',              icon: '👤', href: 'Escola-usuarios.html'          },
];

// ─── Builder ─────────────────────────────────────────────────────────────────
function buildEscolaSidebarNav() {
  const navEl = document.getElementById('sidebar-nav');
  if (!navEl) return;

  const currentPage = (window.ESCOLA_PAGE || '').toLowerCase();

  const html = ESCOLA_NAV_ITEMS.map(item => {
    if (item.section) {
      return `<div class="nav-section-label">${item.section}</div>`;
    }

    const isActive = item.id === currentPage;
    const isLocked = !!item.lock;

    let cls = 'nav-item';
    if (isActive) cls += ' active';
    if (isLocked) cls += ' locked';

    const lockBadge = isLocked
      ? `<span class="lock-badge lock-plan">🔒 ${item.lock}</span>`
      : '';

    const notifBadge = item.badge
      ? `<span class="nav-badge">${item.badge}</span>`
      : '';

    const href = isLocked ? '#' : item.href;

    return `<a class="${cls}" href="${href}"><span class="icon">${item.icon}</span>${item.label}${lockBadge}${notifBadge}</a>`;
  }).join('\n');

  navEl.innerHTML = html;
}

// ─── Auto-init ────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildEscolaSidebarNav);
} else {
  buildEscolaSidebarNav();
}
