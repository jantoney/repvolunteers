// Toast notification system for the application
// Usage: Toast.show(message, type, duration)
// Types: 'success', 'error', 'warning', 'info'

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    // Ensure DOM is ready before creating container
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createContainer());
    } else {
      this.createContainer();
    }
  }

  createContainer() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      
      // Ensure it's appended to body and positioned correctly
      document.body.appendChild(this.container);
      
      // Force container styles for better compatibility
      this.container.style.position = 'fixed';
      this.container.style.top = '20px';
      this.container.style.right = '20px';
      this.container.style.zIndex = '10000';
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';
      this.container.style.gap = '10px';
      this.container.style.pointerEvents = 'none';
      this.container.style.maxWidth = '400px';
      
      console.log('Toast container created and appended to body');
    } else {
      this.container = document.getElementById('toast-container');
      console.log('Toast container already exists');
    }
  }

  show(message, type = 'info', duration = 4000) {
    // Ensure container exists before showing toast
    if (!this.container) {
      this.createContainer();
    }
    
    const toastId = this.generateId();
    const toast = this.createToast(toastId, message, type);
    
    this.container.appendChild(toast);
    this.toasts.set(toastId, toast);

    console.log('Toast created:', { toastId, message, type, container: this.container });

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
      // Apply animation styles inline as fallback
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
      console.log('Toast animation triggered');
    });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hide(toastId);
      }, duration);
    }

    return toastId;
  }

  hide(toastId) {
    const toast = this.toasts.get(toastId);
    if (toast) {
      toast.classList.remove('show');
      toast.classList.add('hiding');
      // Apply hiding styles inline as fallback
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.toasts.delete(toastId);
      }, 300); // Match CSS transition duration
    }
  }

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 4000) {
    return this.show(message, 'info', duration);
  }

  createToast(id, message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('data-toast-id', id);

    // Apply inline styles as fallback for better compatibility
    toast.style.minWidth = '300px';
    toast.style.background = 'white';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.borderLeft = `4px solid ${this.getTypeColor(type)}`;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-in-out';
    toast.style.pointerEvents = 'auto';
    toast.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
    toast.style.position = 'relative';
    toast.style.display = 'block';
    toast.style.width = '100%';

    const icon = this.getIcon(type);
    
    toast.innerHTML = `
      <div class="toast-content" style="display: flex; align-items: flex-start; padding: 16px; gap: 12px; background: inherit; border-radius: inherit;">
        <div class="toast-icon" style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-top: 2px; color: ${this.getTypeColor(type)};">${icon}</div>
        <div class="toast-message" style="flex: 1; font-size: 14px; line-height: 1.4; color: #333; word-wrap: break-word; display: block;">${message}</div>
        <button class="toast-close" onclick="Toast.hide('${id}')" aria-label="Close" style="flex-shrink: 0; background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #666; transition: all 0.2s ease; margin-top: -2px; margin-right: -4px; display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    return toast;
  }

  getTypeColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#007bff'
    };
    return colors[type] || colors.info;
  }

  getIcon(type) {
    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" y1="16" x2="12" y2="12"></line>
               <line x1="12" y1="8" x2="12.01" y2="8"></line>
             </svg>`
    };
    return icons[type] || icons.info;
  }

  generateId() {
    return 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Clear all toasts
  clear() {
    this.toasts.forEach((_toast, id) => {
      this.hide(id);
    });
  }
}

// Create global instance
globalThis.Toast = new ToastManager();

// Also make it available as module export for ES6 imports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastManager;
}
