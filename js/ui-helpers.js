import { config } from './config.js';
import { getSupabase } from './supabase-client.js';
import { signOut, getCurrentUser } from './auth.js';

// --- GOOGLE PLACES SHADOW DOM OVERRIDE INTERCEPTOR ---
if (typeof Element !== 'undefined' && !Element.prototype._shadowIntercepted) {
  Element.prototype._shadowIntercepted = true;
  const origAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function(init) {
    const shadow = origAttach.call(this, init);
    if (this.localName && (this.localName.includes('autocomplete') || this.localName.includes('gmp') || this.localName.includes('place'))) {
      const style = document.createElement('style');
      style.textContent = `
        .input-container, :host {
          background-color: #ffffff !important;
          border-color: #e5e7eb !important;
          color: #111827 !important;
          border-radius: 12px !important;
        }
        input {
          background-color: #ffffff !important;
          color: #111827 !important;
          font-family: inherit !important;
        }
        input::placeholder {
          color: #6b7280 !important;
          opacity: 0.8 !important;
        }
        .prediction-item, [role="option"], li {
          background-color: #ffffff !important;
          color: #1f2937 !important;
          padding: 10px 14px !important;
          cursor: pointer !important;
          border-bottom: 1px solid #f3f4f6 !important;
          transition: background-color 0.15s ease, color 0.15s ease !important;
        }
        .prediction-item:hover, .prediction-item:focus, [role="option"]:hover, [role="option"][aria-selected="true"], li:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        .prediction-item *, [role="option"] *, li * {
          color: inherit !important;
        }
        .prediction-item:hover *, [role="option"]:hover *, li:hover * {
          color: #111827 !important;
        }
      `;
      shadow.appendChild(style);
    }
    return shadow;
  };
}

// --- TOAST NOTIFICATIONS ---
export const showToast = (message, type = 'success') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4';
    document.body.appendChild(container);
  }

  const isSuccess = type === 'success';
  const isError = type === 'error';

  toast.className = `animate-slide-in flex items-center justify-between p-3.5 rounded-2xl border shadow-2xl transition-all duration-300 bg-neutral-900 ${
    isSuccess
      ? 'border-emerald-500/40'
      : isError
        ? 'border-rose-500/40'
        : 'border-blue-500/40'
  }`;

  const iconName = isSuccess ? 'check-circle' : isError ? 'alert-circle' : 'info';

  toast.innerHTML = `
    <div class="flex items-center gap-3 pr-2">
      <div class="p-1.5 rounded-xl ${isSuccess ? 'bg-emerald-500/10 text-emerald-400' : isError ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}">
        <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
      </div>
      <span class="text-xs font-semibold text-neutral-100 leading-snug">${message}</span>
    </div>
    <button class="ml-3 p-1 rounded-lg text-neutral-450 hover:text-neutral-100 hover:bg-neutral-850 transition-colors" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);
  refreshIcons();

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('animate-slide-in');
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// --- LUCIDE ICON REFRESHER ---
export function refreshIcons() {
  if (typeof window !== 'undefined' && window.lucide) {
    window.lucide.createIcons();
  }
}
if (typeof window !== 'undefined') {
  window.refreshIcons = refreshIcons;
}

// --- SKELETON LOADERS ---
export function getTripCardSkeleton() {
  return `
    <div class="glass-card rounded-2xl overflow-hidden border border-neutral-800/40 p-5 flex flex-col gap-4 animate-skeleton">
      <div class="h-40 bg-neutral-800/40 rounded-xl"></div>
      <div class="h-6 bg-neutral-800/40 rounded w-2/3"></div>
      <div class="h-4 bg-neutral-800/40 rounded w-1/2"></div>
      <div class="flex justify-between items-center mt-2">
        <div class="h-8 bg-neutral-800/40 rounded-full w-24"></div>
        <div class="h-8 bg-neutral-800/40 rounded-lg w-16"></div>
      </div>
    </div>
  `;
}

export function getItineraryRowSkeleton() {
  return `
    <div class="flex gap-4 p-4 bg-neutral-900/40 border border-neutral-800/40 rounded-xl items-center animate-skeleton">
      <div class="w-12 h-12 rounded-full bg-neutral-800/40 flex-shrink-0"></div>
      <div class="flex-grow space-y-2">
        <div class="h-5 bg-neutral-800/40 rounded w-1/3"></div>
        <div class="h-3 bg-neutral-800/40 rounded w-1/4"></div>
      </div>
      <div class="h-8 bg-neutral-800/40 rounded w-20"></div>
    </div>
  `;
}

// --- DYNAMIC NAVIGATION BAR ---
export async function loadNavbar() {
  // Check if navbar is already injected
  if (document.querySelector('header')) return;

  const isConfigured = config.isConfigured();
  const supabase = getSupabase();
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (e) {
    console.error(e);
  }

  const currentPath = window.location.pathname;

  const logoHtml = `
    <a href="index.html" class="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-100 hover:opacity-90 transition-opacity">
      <i data-lucide="compass" class="w-6 h-6 text-emerald-500"></i>
      <span>Globe<span class="text-emerald-500">Trotter</span></span>
    </a>
  `;

  let rightMenu = '';
  if (user) {
    const avatar = user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
    const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
    rightMenu = `
      <div class="flex items-center gap-4">
        <!-- Connection Settings Button -->
        <button id="nav-settings-btn" class="p-2 hover:bg-neutral-850 rounded-full text-neutral-450 hover:text-emerald-500 transition-colors" title="Supabase Credentials">
          <i data-lucide="database" class="w-5 h-5"></i>
        </button>
        <!-- User Dropdown Trigger -->
        <div class="relative" x-data="{ open: false }">
          <button @click="open = !open" class="flex items-center gap-2 hover:opacity-90 focus:outline-none transition-opacity bg-neutral-850/60 hover:bg-neutral-850 border border-neutral-800/80 rounded-full py-1 px-1.5 pl-2.5">
            <span class="text-xs font-semibold text-neutral-300 max-w-[100px] truncate hidden md:inline" x-text="user?.email?.split('@')[0] || 'Account'"></span>
            <img src="${avatar}" alt="Avatar" class="w-7 h-7 rounded-full border border-neutral-700 object-cover" onerror="this.outerHTML='<div class=\'w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs\'>${initials}</div>'">
            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-neutral-450 pr-1"></i>
          </button>
          <div x-show="open" @click.away="open = false" x-transition class="absolute right-0 mt-3 w-52 rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-1.5 z-50">
            <div class="px-3 py-2 border-b border-neutral-800 text-xs text-neutral-450 truncate font-mono">
              ${user.email}
            </div>
            <a href="profile.html" class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-850 hover:text-emerald-500 rounded-xl transition-colors">
              <i data-lucide="user" class="w-4 h-4"></i> Profile Settings
            </a>
            <a href="dashboard.html" class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-850 hover:text-emerald-500 rounded-xl transition-colors">
              <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard
            </a>
            <a href="admin.html" class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-850 hover:text-emerald-500 rounded-xl transition-colors">
              <i data-lucide="shield-alert" class="w-4 h-4"></i> Admin Panel
            </a>
            <button id="logout-btn" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-left">
              <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    rightMenu = `
      <div class="flex items-center gap-3">
        <button id="nav-settings-btn" class="p-2 hover:bg-neutral-850 rounded-full text-neutral-450 hover:text-emerald-500 transition-colors mr-1" title="Supabase Credentials">
          <i data-lucide="database" class="w-5 h-5"></i>
        </button>
        <a href="index.html" class="px-4 py-1.5 text-xs font-extrabold rounded-full bg-emerald-500 text-black hover:bg-emerald-600 transition-all shadow-md">Sign In</a>
      </div>
    `;
  }

  const header = document.createElement('header');
  header.className = 'sticky top-3 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6';
  header.innerHTML = `
    <div class="bg-neutral-900 border border-neutral-800 rounded-full px-6 py-3 shadow-none flex items-center justify-between transition-all duration-300">
      <div class="flex items-center gap-3">
        ${user ? `
          <button id="mobile-toggle-btn" class="md:hidden p-2 hover:bg-neutral-850 rounded-full text-neutral-450 hover:text-emerald-500 transition-colors" title="Toggle Menu">
            <i data-lucide="menu" class="w-5 h-5"></i>
          </button>
        ` : ''}
        ${!user ? logoHtml : `
          <a href="dashboard.html" class="flex items-center gap-2.5 text-sm font-semibold text-neutral-100 hover:opacity-90 transition-opacity">
            <div class="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
              <i data-lucide="compass" class="w-4 h-4"></i>
            </div>
            <span class="font-extrabold tracking-tight text-base">Globe<span class="text-emerald-500">Trotter</span></span>
            <span class="text-neutral-600 hidden sm:inline">•</span>
            <span class="capitalize text-xs font-medium text-neutral-400 hidden sm:inline">${currentPath.split('/').pop().replace('.html', '') || 'Dashboard'}</span>
          </a>
        `}
      </div>
      ${rightMenu}
    </div>
  `;

  // Left Sidebar Element for Logged In users (FULL HEIGHT: top-0, 100vh)
  let sidebar = null;
  if (user) {
    sidebar = document.createElement('div');
    sidebar.id = 'left-sidebar';
    sidebar.className = 'fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-neutral-200/80 flex flex-col justify-between shadow-md h-full';

    // Set initial toggle state before rendering to prevent visual flicker
    const isToggled = localStorage.getItem('sidebar-toggled') === 'true';
    if (isToggled) {
      sidebar.classList.add('toggled-open');
      document.body.classList.add('sidebar-push');
    } else {
      document.body.classList.remove('sidebar-push');
    }
    document.body.classList.add('sidebar-active');

    const sidebarLinks = [
      { path: 'dashboard.html', label: 'Dashboard', icon: 'plane' },
      { path: 'city-search.html', label: 'Explore', icon: 'palmtree' },
      { path: 'community.html', label: 'Community', icon: 'globe' },
      { path: 'profile.html', label: 'Profile', icon: 'user' },
      { path: 'admin.html', label: 'Admin', icon: 'sliders' }
    ];

    const linksHtml = sidebarLinks.map(link => {
      const active = currentPath.endsWith(link.path);
      const activeClass = active
        ? 'border-l-4 border-emerald-500 bg-orange-50/80 text-emerald-600 font-bold'
        : 'border-l-4 border-transparent text-neutral-600 hover:text-emerald-500 hover:bg-orange-50/40';
      return `
        <a href="${link.path}" class="flex items-center h-12 px-4 gap-4 ${activeClass} transition-all duration-200">
          <i data-lucide="${link.icon}" class="w-5 h-5 flex-shrink-0"></i>
          <span class="nav-label text-sm font-medium">${link.label}</span>
        </a>
      `;
    }).join('');

    sidebar.innerHTML = `
      <!-- Top Section: Logo & Toggle Button -->
      <div class="h-16 flex-shrink-0 flex items-center px-4 border-b border-neutral-100 justify-between relative">
        <a href="dashboard.html" class="flex items-center gap-3 text-lg font-extrabold tracking-tight text-neutral-800 hover:opacity-90 transition-opacity">
          <i data-lucide="compass" class="w-6 h-6 text-emerald-500 flex-shrink-0"></i>
          <span class="nav-label whitespace-nowrap"><span class="text-black">Globe</span><span class="text-emerald-500">Trotter</span></span>
        </a>
        <button id="sidebar-toggle-btn" class="nav-label p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-450 hover:text-emerald-500 transition-colors" title="Toggle Sidebar">
          <i data-lucide="panel-left-close" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Middle Section: Navigation Links (SCROLLABLE) -->
      <div class="flex-grow min-h-0 overflow-y-auto py-3 gap-1 flex flex-col custom-scrollbar">
        ${linksHtml}
      </div>

      <!-- Bottom Section: Actions & Sign Out -->
      <div class="flex-shrink-0 flex flex-col py-3 border-t border-neutral-100 gap-1 bg-white">
        <!-- Database Settings -->
        <button id="sidebar-settings-btn" class="flex items-center h-12 px-4 gap-4 text-neutral-600 hover:text-emerald-500 hover:bg-orange-50/40 transition-all duration-200 border-l-4 border-transparent text-left w-full">
          <i data-lucide="database" class="w-5 h-5 flex-shrink-0"></i>
          <span class="nav-label text-sm font-medium">Database</span>
        </button>
        <!-- Sign Out -->
        <button id="sidebar-logout-btn" class="flex items-center h-12 px-4 gap-4 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 border-l-4 border-transparent text-left w-full">
          <i data-lucide="log-out" class="w-5 h-5 flex-shrink-0"></i>
          <span class="nav-label text-sm font-medium">Sign Out</span>
        </button>
      </div>
    `;
  }

  // Prepend header to body
  document.body.insertBefore(header, document.body.firstChild);

  // Insert sidebar if user is logged in
  if (sidebar) {
    document.body.insertBefore(sidebar, header.nextSibling);

    // Inject mobile backdrop overlay
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'sidebar-backdrop';
      backdrop.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 hidden md:hidden transition-opacity duration-300 opacity-0';
      document.body.appendChild(backdrop);
    }
  }

  refreshIcons();

  // Sidebar toggle event listener
  if (user) {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
    const sidebarEl = document.getElementById('left-sidebar');
    const backdropEl = document.getElementById('sidebar-backdrop');

    const handleToggle = () => {
      const willBeOpen = !sidebarEl.classList.contains('toggled-open');
      if (willBeOpen) {
        sidebarEl.classList.add('toggled-open');
        document.body.classList.add('sidebar-push');
        localStorage.setItem('sidebar-toggled', 'true');
        if (backdropEl && window.innerWidth <= 768) {
          backdropEl.classList.remove('hidden');
          setTimeout(() => {
            backdropEl.classList.add('opacity-100');
          }, 10);
        }
      } else {
        sidebarEl.classList.remove('toggled-open');
        document.body.classList.remove('sidebar-push');
        localStorage.setItem('sidebar-toggled', 'false');
        if (backdropEl && window.innerWidth <= 768) {
          backdropEl.classList.remove('opacity-100');
          setTimeout(() => {
            backdropEl.classList.add('hidden');
          }, 300);
        }
      }
    };

    if (toggleBtn && sidebarEl) {
      toggleBtn.addEventListener('click', handleToggle);
    }
    if (mobileToggleBtn && sidebarEl) {
      mobileToggleBtn.addEventListener('click', handleToggle);
    }
    if (backdropEl) {
      backdropEl.addEventListener('click', () => {
        if (sidebarEl.classList.contains('toggled-open')) {
          handleToggle();
        }
      });
    }
  }

  // Intercept all links for a smooth loading line transition
  const allLinks = document.querySelectorAll('header a, #left-sidebar a');
  allLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    link.addEventListener('click', async (e) => {
      e.preventDefault();
      await showTopLoadingBar(500);
      window.location.href = href;
    });
  });

  // Setup event listeners for Database & Logout
  const settingsBtn = document.getElementById('nav-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      injectSetupModal(true);
    });
  }
  const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
  if (sidebarSettingsBtn) {
    sidebarSettingsBtn.addEventListener('click', () => {
      injectSetupModal(true);
    });
  }

  const handleLogout = async (e) => {
    e.preventDefault();
    showToast("Signing out...");
    await showTopLoadingBar(500);
    await signOut();
    window.location.href = 'index.html';
  };

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', handleLogout);
  }
}

// --- GLOBAL TOP PROGRESS LOADING LINE ---
export function showTopLoadingBar(delay = 500) {
  let bar = document.getElementById('top-loading-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'top-loading-bar';
    bar.className = 'fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 z-50 transition-all ease-out';
    bar.style.width = '0%';
    bar.style.opacity = '0';
    bar.style.transitionDuration = '0ms';
    document.body.appendChild(bar);
  }

  bar.style.transitionDuration = '0ms';
  bar.style.width = '0%';
  bar.style.opacity = '1';

  // Force browser reflow
  bar.offsetHeight;

  bar.style.transitionDuration = `${delay}ms`;
  bar.style.width = '100%';

  return new Promise(resolve => {
    setTimeout(() => {
      bar.style.opacity = '0';
      resolve();
    }, delay);
  });
}

// --- SETUP MODAL FOR CREDENTIALS ---
export function injectSetupModal(force = false) {
  if (!force && config.isConfigured()) return;

  // Check if modal already exists
  if (document.getElementById('supabase-setup-modal')) {
    document.getElementById('supabase-setup-modal').classList.remove('hidden');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'supabase-setup-modal';
  modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex justify-center items-start sm:items-center p-4';

  modal.innerHTML = `
    <div class="glass-panel w-full max-w-md rounded-2xl p-6 border border-neutral-800 shadow-2xl relative my-8 sm:my-auto">
      ${force ? `
        <button id="close-setup-modal" class="absolute top-4 right-4 text-neutral-450 hover:text-neutral-100 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      ` : ''}
      
      <div class="flex items-center gap-3 mb-4">
        <div class="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
          <i data-lucide="database" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="text-lg font-bold text-neutral-100">Connect Supabase</h3>
          <p class="text-xs text-neutral-450">Set up your backend connection</p>
        </div>
      </div>

      <p class="text-sm text-neutral-450 mb-5 leading-relaxed">
        GlobeTrotter runs client-side. Please enter your project credentials. You can find these in your Supabase Project Settings under <strong>API</strong>.
      </p>

      <form id="setup-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-450 mb-1">Supabase Project URL</label>
          <input type="url" id="setup-url" required placeholder="https://your-project.supabase.co" 
            class="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-450 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-450 mb-1">Supabase Anon Key</label>
          <input type="password" id="setup-key" required placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
            class="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-450 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all">
        </div>

        <div class="flex gap-3 pt-2">
          <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-extrabold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md">
            <i data-lucide="plug" class="w-4 h-4"></i>
            <span>Save & Connect</span>
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  refreshIcons();

  // Pre-fill if configured
  if (config.isConfigured()) {
    document.getElementById('setup-url').value = config.getSupabaseUrl();
    document.getElementById('setup-key').value = config.getSupabaseAnonKey();
  }

  // Handle Form Submit
  const form = document.getElementById('setup-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('setup-url').value;
    const key = document.getElementById('setup-key').value;

    if (config.setCredentials(url, key)) {
      showToast("Credentials saved! Reconnecting...", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      showToast("Failed to save. Check URL and Key format.", "error");
    }
  });

  // Handle Modal Close
  const closeBtn = document.getElementById('close-setup-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }
}

// Global click interceptor for all local HTML page transitions
if (typeof document !== 'undefined') {
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    if (e.defaultPrevented) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Check if it's a relative/local link
    const isLocal = !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//') && !href.startsWith('mailto:') && !href.startsWith('tel:');
    if (isLocal && !href.startsWith('#') && !href.startsWith('javascript:') && link.target !== '_blank') {
      e.preventDefault();
      await showTopLoadingBar(450);
      window.location.href = href;
    }
  });
}
