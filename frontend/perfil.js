document.addEventListener('DOMContentLoaded', () => {
  const authBtn = document.getElementById('btn-auth-action');
  const authIcon = document.getElementById('auth-icon');
  const authText = document.getElementById('auth-text');
  
  const displayName = document.getElementById('user-display-name');
  const displayRole = document.getElementById('user-display-role');
  const emailInput = document.getElementById('email');
  const nameInput = document.getElementById('nome');

  // Recupera token e dados do usuário salvos
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  if (token && userData) {
    // ----------------------------------------------------
    // USUÁRIO LOGADO
    // ----------------------------------------------------
    if (displayName) displayName.textContent = userData.name || 'Cliente Imperial';
    if (displayRole) displayRole.textContent = 'Cliente Imperial';
    if (nameInput) nameInput.value = userData.name || '';
    if (emailInput) emailInput.value = userData.email || '';

    // Configura o botão para LOGOUT (Sair)
    if (authText) authText.textContent = 'Sair da Conta';
    if (authIcon) authIcon.innerHTML = '&#10006;'; // Ícone X
    
    if (authBtn) {
      authBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (typeof window.logout === 'function') {
          await window.logout();
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('token_expires_at');
        }
        window.location.reload();
      });
    }

  } else {
    // ----------------------------------------------------
    // VISITANTE (NÃO LOGADO)
    // ----------------------------------------------------
    if (displayName) displayName.textContent = 'Visitante';
    if (displayRole) displayRole.textContent = 'Acesso Limitado';

    // Configura o botão para LOGIN
    if (authText) authText.textContent = 'Fazer Login';
    if (authIcon) authIcon.innerHTML = '&#128274;'; // Ícone Cadeado

    if (authBtn) {
      authBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.openAuthModal === 'function') {
          window.openAuthModal();
        } else {
          console.error('Função openAuthModal não encontrada.');
        }
      });
    }
  }
});