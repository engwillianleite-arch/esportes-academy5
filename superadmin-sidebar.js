/**
 * superadmin-sidebar.js
 * Menu lateral compartilhado para todas as telas do Portal SuperAdmin.
 *
 * Como usar em cada tela HTML:
 *   1. Adicione antes de </body>:
 *      <script>window.SUPERADMIN_PAGE = 'dashboard';</script>
 *      <script src="superadmin-sidebar.js"></script>
 *   2. O sidebar deve ter a estrutura:
 *      <aside class="sidebar" id="sidebar">
 *        <div class="sidebar-logo">...</div>
 *        <nav class="sidebar-nav" id="sidebar-nav"></nav>
 *        <div class="sidebar-footer">
 *          <div class="user-row">
 *            <div class="user-ava" id="sidebarAva">SA</div>
 *            <div class="user-info">
 *              <div class="u-name" id="sidebarName">Super Admin</div>
 *              <div class="u-role" id="sidebarRole">super_admin</div>
 *            </div>
 *          </div>
 *        </div>
 *      </aside>
 */

// ─── Nav definition ──────────────────────────────────────────────────────────
const SUPERADMIN_NAV_ITEMS = [
  { section: 'Principal' },
  { id: 'dashboard',    label: 'Dashboard',         icon: '📊', href: 'SuperAdmin-dashboard.html'    },
  { id: 'schools',      label: 'Escolas',            icon: '🏫', href: 'SuperAdmin-schools.html'      },
  { id: 'usuarios',     label: 'Usuários',           icon: '👤', href: 'SuperAdmin-usuarios.html'     },

  { section: 'Financeiro' },
  { id: 'cobrancas',    label: 'Fluxo de Caixa',     icon: '💸', href: 'SuperAdmin-cobrancas.html'    },
  { id: 'planos',       label: 'Planos & Licenças',  icon: '📦', href: 'SuperAdmin-planos.html'       },
  { id: 'relatorios',   label: 'Relatórios',         icon: '📈', href: 'SuperAdmin-relatorios.html'  },
  { id: 'notasfiscais', label: 'Notas Fiscais',      icon: '🧾', href: '#'                            },

  { section: 'Sistema' },
  { id: 'notificacoes', label: 'Notificações',       icon: '🔔', href: 'SuperAdmin-notificacoes.html' },
  { id: 'permissoes',   label: 'Permissões',         icon: '🛡️', href: 'SuperAdmin-permissoes.html'   },
  { id: 'configuracoes',label: 'Configurações',      icon: '⚙️', href: 'SuperAdmin-configuracoes.html'},
];

// ─── Builder ─────────────────────────────────────────────────────────────────
function buildSuperAdminSidebarNav() {
  const navEl = document.getElementById('sidebar-nav');
  if (!navEl) return;

  const currentPage = (window.SUPERADMIN_PAGE || '').toLowerCase();

  const html = SUPERADMIN_NAV_ITEMS.map(item => {
    if (item.section) {
      return `<div class="nav-section-label">${item.section}</div>`;
    }

    const isActive = item.id === currentPage;
    const isStub   = item.href === '#';

    let cls = 'nav-item';
    if (isActive) cls += ' active';
    if (isStub)   cls += ' stub';

    const badge = item.badge
      ? `<span class="nav-badge">${item.badge}</span>`
      : '';

    return `<a class="${cls}" href="${item.href}"><span class="nav-icon">${item.icon}</span>${item.label}${badge}</a>`;
  }).join('\n');

  navEl.innerHTML = html;
}

// ─── Auto-init ────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildSuperAdminSidebarNav);
} else {
  buildSuperAdminSidebarNav();
}
