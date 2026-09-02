import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={styles.brand}>
        mini <span>Blog</span>
      </NavLink>
      <ul className={styles.links_list}>
        <li>
            <NavLink to="/" className={({isActive}) => (isActive ? styles.active: "")}>
              Home
            </NavLink>
            </li>
            <li>
            <NavLink to="/about" className={({isActive}) => (isActive ? styles.active: "")}>
              Sobre
            </NavLink>
            </li>
            <li>
            <NavLink to="/Register" className={({isActive}) => (isActive ? styles.active: "")}>
              Cadastrar
            </NavLink>
            </li>
            <li>
            <NavLink to="/Login" className={({isActive}) => (isActive ? styles.active: "")}>
              Registro
            </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;