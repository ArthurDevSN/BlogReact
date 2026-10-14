import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthentication } from '../../hooks/useAuthentication';
import styles from './Register.module.css';

const Register = () => {
  const { createUser, error: authError, loading, pendingProfile } = useAuthentication();
  const [displayName, setDisplayName] = useState(pendingProfile?.displayName || '');
  const [email, setEmail] = useState(pendingProfile?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const location = useLocation();
  const error = formError || authError;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!displayName.trim()) {
      setFormError('Informe seu nome.');
      return;
    }
    if (!pendingProfile && password !== confirmPassword) {
      setFormError('As senhas precisam ser iguais.');
      return;
    }
    await createUser({ displayName, email, password });
  };

  return (
    <div className={styles.register}>
      <h1>Cadastrar-se para postar</h1>
      <p>Crie seu usuário e compartilhe suas histórias</p>
      {pendingProfile && <p>Sua conta foi criada. Salve seu nome para concluir o cadastro.</p>}
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby={error ? 'register-error' : undefined}>
        <label>
          <span>Nome:</span>
          <input type="text" name="displayName" required maxLength={80} autoComplete="name" disabled={loading}
            placeholder="Nome do usuário" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label>
          <span>E-mail:</span>
          <input type="email" name="email" required autoComplete="email" disabled={loading || Boolean(pendingProfile)}
            placeholder="E-mail do usuário" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Senha:</span>
          <input type="password" name="password" required={!pendingProfile} minLength={6} autoComplete="new-password" disabled={loading || Boolean(pendingProfile)}
            placeholder="Pelo menos 6 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>
          <span>Confirmação de senha:</span>
          <input type="password" name="confirmationPassword" required={!pendingProfile} minLength={6} autoComplete="new-password" disabled={loading || Boolean(pendingProfile)}
            placeholder="Confirme a sua senha" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Aguarde...' : pendingProfile ? 'Salvar nome' : 'Cadastrar'}</button>
        {error && <p id="register-error" className="error" role="alert">{error}</p>}
      </form>
      <p>Já tem uma conta? <Link to="/login" state={location.state}>Entrar</Link></p>
    </div>
  );
};

export default Register;
