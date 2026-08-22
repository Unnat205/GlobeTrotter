import { config } from './config.js';
import { getSupabase } from './supabase-client.js';
import { signOut, getCurrentUser } from './auth.js';

// --- TOAST NOTIFICATIONS ---
export const showToast = (message, type = 'success') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `animate-slide-in flex items-center justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${
    type === 'success' 
      ? 'bg-emerald-50 border-emerald-500/30 text-emerald-600' 
      : type === 'error'
      ? 'bg-rose-50 border-rose-500/30 text-rose-600'
      : 'bg-blue-50 border-blue-500/30 text-blue-600'
  }`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
      <span class="text-sm font-medium text-neutral-800">${message}</span>
    </div>
    <button class="ml-4 text-neutral-450 hover:text-neutral-200 transition-colors" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-4 h-4"></i>
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
        <button id="nav-settings-btn" class="p-2 hover:bg-neutral-850 rounded-lg text-neutral-450 hover:text-emerald-500 transition-colors" title="Supabase Credentials">
          <i data-lucide="database" class="w-5 h-5"></i>
        </button>
        <!-- User Dropdown Trigger -->
        <div class="relative" x-data="{ open: false }">
          <button @click="open = !open" class="flex items-center gap-2 hover:opacity-90 focus:outline-none transition-opacity">
            <img src="${avatar}" alt="Avatar" class="w-8 h-8 rounded-full border border-neutral-800 object-cover" onerror="this.outerHTML='<div class=\'w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs\'>${initials}</div>'">
            <i data-lucide="chevron-down" class="w-4 h-4 text-neutral-450"></i>
          </button>
          <div x-show="open" @click.away="open = false" x-transition class="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-1 z-50">
            <div class="px-3 py-2 border-b border-neutral-800 text-xs text-neutral-450 truncate">
              ${user.email}
            </div>
            <a href="profile.html" class="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-850 hover:text-emerald-500 rounded-lg transition-colors">
              <i data-lucide="user" class="w-4 h-4"></i> Profile Settings
            </a>
            <a href="dashboard.html" class="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-850 hover:text-emerald-500 rounded-lg transition-colors">
              <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard
            </a>
            <a href="admin.html" class="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-850 hover:text-emerald-500 rounded-lg transition-colors">
              <i data-lucide="shield-alert" class="w-4 h-4"></i> Admin Panel
            </a>
            <button id="logout-btn" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-left">
              <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    rightMenu = `
      <div class="flex items-center gap-3">
        <button id="nav-settings-btn" class="p-2 hover:bg-neutral-850 rounded-lg text-neutral-450 hover:text-emerald-500 transition-colors mr-2" title="Supabase Credentials">
          <i data-lucide="database" class="w-5 h-5"></i>
        </button>
        <a href="index.html" class="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-emerald-500 transition-colors">Sign In</a>
      </div>
    `;
  }

  const header = document.createElement('header');
  header.className = 'sticky top-0 z-40 w-full border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-md';
  header.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        ${user ? `
          <button id="mobile-toggle-btn" class="md:hidden p-2 hover:bg-neutral-850 rounded-lg text-neutral-450 hover:text-emerald-500 transition-colors" title="Toggle Menu">
            <i data-lucide="menu" class="w-5 h-5"></i>
          </button>
        ` : ''}
        ${!user ? logoHtml : `
          <div class="flex items-center gap-2 text-sm font-semibold text-neutral-450">
            <i data-lucide="compass" class="w-4 h-4 text-emerald-500"></i>
            <span class="capitalize">${currentPath.split('/').pop().replace('.html', '') || 'Dashboard'}</span>
          </div>
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
    sidebar.className = 'fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-neutral-200/80 flex flex-col justify-between overflow-hidden shadow-md h-full';
    
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
          <span class="nav-label whitespace-nowrap">Globe<span class="text-emerald-500">Trotter</span></span>
        </a>
        <button id="sidebar-toggle-btn" class="nav-label p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-450 hover:text-emerald-500 transition-colors" title="Toggle Sidebar">
          <i data-lucide="panel-left-close" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Middle Section: Navigation Links (SCROLLABLE) -->
      <div class="flex-grow overflow-y-auto py-3 gap-1 flex flex-col custom-scrollbar">
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
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4';

  modal.innerHTML = `
    <div class="glass-panel w-full max-w-md rounded-2xl p-6 border border-neutral-800 shadow-2xl relative">
      ${force ? `
        <button id="close-setup-modal" class="absolute top-4 right-4 text-neutral-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      ` : ''}
      
      <div class="flex items-center gap-3 mb-4">
        <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <i data-lucide="database" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white">Connect Supabase</h3>
          <p class="text-xs text-neutral-400">Set up your backend connection</p>
        </div>
      </div>

      <p class="text-sm text-neutral-300 mb-5 leading-relaxed">
        GlobeTrotter runs entirely client-side. Please enter your project credentials. You can get these in your Supabase Project Settings under <strong>API</strong>.
      </p>

      <form id="setup-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Supabase Project URL</label>
          <input type="url" id="setup-url" required placeholder="https://your-project.supabase.co" 
            class="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Supabase Anon Key</label>
          <input type="password" id="setup-key" required placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
            class="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all">
        </div>

        <div class="flex gap-3 pt-2">
          <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-semibold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
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
