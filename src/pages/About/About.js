import styles from './About.module.css';

import React from 'react';

import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className={styles.about}>
        <h1>
          Sobre o Mini <span>Blog</span>
          </h1>
          <p>
            O MiniBlog é um espaço para compartilhar histórias e conhecimento, feito com React e Firebase.
          </p>
          <Link to="/posts/create" className="btn">
            Criar Post
          </Link>
    </div>
  );
}

export default About;
