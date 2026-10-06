document.addEventListener('DOMContentLoaded', async () => {
  const authBtn = document.getElementById('btn-auth-action');
  const authIcon = document.getElementById('auth-icon');
  const authText = document.getElementById('auth-text');
  const displayName = document.getElementById('user-display-name');
  const displayRole = document.getElementById('user-display-role');
  const emailInput = document.getElementById('email');
  const nameInput = document.getElementById('nome');
  const profileForm = document.getElementById('form-perfil');
  const statusMessage = document.getElementById('status-message');

  const token = localStorage.getItem('token');
  let userData = null;

  try {
    userData = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    localStorage.removeItem('user');
  }

  const showStatus = (message, type = 'success') => {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.style.display = message ? 'block' : 'none';
    statusMessage.style.background = type === 'error' ? '#fce8e6' : '#e8f5e9';
    statusMessage.style.color = type === 'error' ? '#a50e0e' : '#1b5e20';
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
  };

  const setUser = (user) => {
    userData = user;
    localStorage.setItem('user', JSON.stringify(user));
    if (displayName) displayName.textContent = user.name || 'Cliente Imperial';
    if (displayRole) displayRole.textContent = user.role === 'admin' ? 'Administrador' : 'Cliente Imperial';
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
  };

  if (token && userData) {
    setUser(userData);
    if (authText) authText.textContent = 'Sair da Conta';
    if (authIcon) authIcon.innerHTML = '&#10006;';

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/me', {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        clearSession();
        window.location.reload();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data?.user) setUser(data.user);
      }
    } catch {
      // Mantém os dados locais quando a API estiver temporariamente indisponível.
    }

    authBtn?.addEventListener('click', async (event) => {
      event.preventDefault();
      await window.logout?.();
      window.location.reload();
    });

    profileForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      showStatus('Salvando…');

      const name = nameInput?.value.trim() || '';
      const email = emailInput?.value.trim() || '';
      if (!name || !email) {
        showStatus('Nome e e-mail são obrigatórios.', 'error');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/me', {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, email }),
        });
        const data = await response.json().catch(() => null);

        if (response.status === 401) {
          clearSession();
          window.location.reload();
          return;
        }
        if (!response.ok) {
          const fieldError = Object.values(data?.errors || {})[0]?.[0];
          throw new Error(fieldError || data?.message || 'Não foi possível atualizar o perfil.');
        }

        setUser(data.user);
        showStatus('Dados atualizados com sucesso.');
      } catch (error) {
        showStatus(error.message || 'Não foi possível atualizar o perfil.', 'error');
      }
    });
  } else {
    if (displayName) displayName.textContent = 'Visitante';
    if (displayRole) displayRole.textContent = 'Acesso Limitado';
    if (authText) authText.textContent = 'Fazer Login';
    if (authIcon) authIcon.innerHTML = '&#128274;';

    authBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      window.openAuthModal?.();
    });

    profileForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      window.openAuthModal?.();
    });
  }
});
