import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthentication } from '../../hooks/useAuthentication';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useAuthentication();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login({ email, password });
  };

  return (
    <div className={styles.login}>
      <h1>Entrar</h1>
      <p>Faça o login para compartilhar suas histórias</p>
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby={error ? 'login-error' : undefined}>
        <label>
          <span>E-mail:</span>
          <input type="email" name="email" required autoComplete="email" disabled={loading}
            placeholder="E-mail do usuário" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Senha:</span>
          <input type="password" name="password" required autoComplete="current-password" disabled={loading}
            placeholder="Insira sua senha" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Aguarde...' : 'Entrar'}</button>
        {error && <p id="login-error" className="error" role="alert">{error}</p>}
      </form>
      <p>Ainda não tem uma conta? <Link to="/register" state={location.state}>Cadastre-se</Link></p>
    </div>
  );
};

export default Login;
