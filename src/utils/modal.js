// Modal System JavaScript
class ModalSystem {
  constructor() {
    this.modals = new Map();
    this.setupGlobalStyles();
  }

  setupGlobalStyles() {
    // Add modal CSS if not already present
    if (!document.getElementById('modal-system-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-system-styles';
      style.textContent = `
        /* Modal System CSS */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-overlay.show {
          display: flex;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-content.large {
          max-width: 800px;
          width: 95%;
        }

        .modal-header {
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .modal-close:hover {
          background: #f8f9fa;
          color: #333;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-footer {
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid #dee2e6;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .modal-btn-primary {
          background: #007bff;
          color: white;
        }

        .modal-btn-primary:hover {
          background: #0056b3;
        }

        .modal-btn-danger {
          background: #dc3545;
          color: white;
        }

        .modal-btn-danger:hover {
          background: #c82333;
        }

        .modal-btn-secondary {
          background: #6c757d;
          color: white;
        }

        .modal-btn-secondary:hover {
          background: #5a6268;
        }

        .modal-btn-outline {
          background: transparent;
          border: 1px solid #dee2e6;
          color: #6c757d;
        }

        .modal-btn-outline:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }

        .shift-details-modal {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .shift-details-modal .shift-role {
          font-weight: bold;
          color: #007bff;
          margin-bottom: 0.5rem;
        }

        .shift-details-modal .shift-time {
          color: #666;
          font-size: 0.9rem;
        }

        .shift-details-modal .show-info {
          color: #495057;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
      `;
      document.head.appendChild(style);
    }
  }

  createModal(id, options = {}) {
    const {
      title = 'Modal',
      body = '',
      buttons = [],
      closable = true,
      className = '',
      size = 'normal' // 'normal' or 'large'
    } = options;

    // Remove existing modal with same ID
    this.destroyModal(id);

    const overlay = document.createElement('div');
    overlay.className = `modal-overlay ${className}`;
    overlay.id = `modal-${id}`;

    const contentClass = size === 'large' ? 'modal-content large' : 'modal-content';

    overlay.innerHTML = `
      <div class="${contentClass}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          ${closable ? '<button class="modal-close" data-action="close">&times;</button>' : ''}
        </div>
        <div class="modal-body">
          ${body}
        </div>
        ${buttons.length > 0 ? `
          <div class="modal-footer">
            ${buttons.map(btn => `
              <button class="modal-btn ${btn.className || 'modal-btn-outline'}" 
                      data-action="${btn.action || 'close'}"
                      ${btn.disabled ? 'disabled' : ''}>
                ${btn.text}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Add click handlers
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && closable) {
        this.closeModal(id);
      }
    });

    overlay.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        const button = buttons.find(btn => btn.action === action) || { action: 'close' };
        if (button.handler) {
          button.handler(e, this);
        }
        if (action === 'close' || action === 'ok' || action === 'cancel' || action === 'confirm') {
          this.closeModal(id);
        }
      }
    });

    document.body.appendChild(overlay);
    this.modals.set(id, overlay);

    return overlay;
  }

  showModal(id, options = {}) {
    let modal = this.modals.get(id);
    if (!modal && options) {
      modal = this.createModal(id, options);
    }
    if (modal) {
      modal.classList.add('show');
      // Focus trap
      const firstButton = modal.querySelector('button');
      if (firstButton) firstButton.focus();
    }
    return modal;
  }

  closeModal(id) {
    const modal = this.modals.get(id);
    if (modal) {
      modal.classList.remove('show');
    }
  }

  destroyModal(id) {
    const modal = this.modals.get(id);
    if (modal) {
      modal.remove();
      this.modals.delete(id);
    }
  }

  updateModalBody(id, body) {
    const modal = this.modals.get(id);
    if (modal) {
      const bodyEl = modal.querySelector('.modal-body');
      if (bodyEl) {
        bodyEl.innerHTML = body;
      }
    }
  }

  // Convenience methods
  confirm(title, message, onConfirm, onCancel = null) {
    return this.showModal('confirm', {
      title,
      body: `<p>${message}</p>`,
      buttons: [
        {
          text: 'Cancel',
          className: 'modal-btn-outline',
          action: 'cancel',
          handler: onCancel || (() => {})
        },
        {
          text: 'Confirm',
          className: 'modal-btn-primary',
          action: 'confirm',
          handler: onConfirm
        }
      ]
    });
  }

  alert(title, message, onOk = null) {
    return this.showModal('alert', {
      title,
      body: `<p>${message}</p>`,
      buttons: [
        {
          text: 'OK',
          className: 'modal-btn-primary',
          action: 'ok',
          handler: onOk || (() => {})
        }
      ]
    });
  }

  error(title, message, onOk = null) {
    return this.showModal('error', {
      title: title || 'Error',
      body: `<p style="color: #dc3545;">${message}</p>`,
      buttons: [
        {
          text: 'OK',
          className: 'modal-btn-danger',
          action: 'ok',
          handler: onOk || (() => {})
        }
      ]
    });
  }

  success(title, message, onOk = null) {
    return this.showModal('success', {
      title: title || 'Success',
      body: `<p style="color: #28a745;">${message}</p>`,
      buttons: [
        {
          text: 'OK',
          className: 'modal-btn-primary',
          action: 'ok',
          handler: onOk || (() => {})
        }
      ]
    });
  }

  info(title, message, onOk = null) {
    return this.showModal('info', {
      title: title || 'Information',
      body: `<p>${message}</p>`,
      buttons: [
        {
          text: 'OK',
          className: 'modal-btn-primary',
          action: 'ok',
          handler: onOk || (() => {})
        }
      ]
    });
  }

  // Method for displaying raw HTML content without wrapping in <p> tags
  html(title, htmlContent, onOk = null, size = 'normal') {
    return this.showModal('html', {
      title: title || 'Information',
      body: htmlContent,
      size: size,
      buttons: [
        {
          text: 'OK',
          className: 'modal-btn-primary',
          action: 'ok',
          handler: onOk || (() => {})
        }
      ]
    });
  }
}

// Create global instance
window.Modal = new ModalSystem();

// Global helper functions for backward compatibility
window.modalConfirm = (message, onConfirm, onCancel) => {
  return window.Modal.confirm('Confirm', message, onConfirm, onCancel);
};

window.modalAlert = (message, onOk) => {
  return window.Modal.alert('Alert', message, onOk);
};

window.modalError = (message, onOk) => {
  return window.Modal.error('Error', message, onOk);
};

window.modalSuccess = (message, onOk) => {
  return window.Modal.success('Success', message, onOk);
};
