import React from 'react';
import { NavLink } from 'react-router-dom';

import { useAuthentication } from '../hooks/useAuthentication';

import { useAuthValue } from '../context/AuthContext';

import styles from './Navbar.module.css';

const Navbar = () => {

  const { user } = useAuthValue();
  const { logout, loading, error } = useAuthentication();

  return (
    <header>
    <nav className={styles.navbar} aria-label="Navegação principal">
      <NavLink to="/" className={styles.brand}>
        mini <span>Blog</span>
      </NavLink>
      <ul className={styles.links_list}>
        <li>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : "")}>
            Home
          </NavLink>
        </li>
        {!user && (
          <>
            <li>
              <NavLink to="/register" className={({ isActive }) => (isActive ? styles.active : "")}>
                Cadastrar
              </NavLink>
            </li>
            <li>
              <NavLink to="/login" className={({ isActive }) => (isActive ? styles.active : "")}>
                Login
              </NavLink>

            </li>
          </>
        )}
         {user && (
          <>
            <li>
              <NavLink to="/posts/create" className={({ isActive }) => (isActive ? styles.active : "")}>
                Novo Post
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? styles.active : "")}>
                Dashboard
              </NavLink>

            </li>
          </>
        )}
              <li>
          <NavLink to="/about" className={({ isActive }) => (isActive ? styles.active : "")}>
            Sobre
          </NavLink>
        </li>
        {user && (
          <li>
            <button type="button" onClick={logout} disabled={loading} aria-busy={loading}>
              {loading ? 'Saindo...' : 'Sair'}
            </button>
          </li>
        )}
      </ul>
    </nav>
    {error && <p className={styles.logout_error} role="alert">{error}</p>}
    </header>
  );
}

export default Navbar;
