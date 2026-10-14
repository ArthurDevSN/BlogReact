import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
        <h2>MiniBlog</h2>
        <p>Compartilhe suas histórias e seu conhecimento.</p>
        <p>MiniBlog &copy; {new Date().getFullYear()}</p>
    </footer>
  );
}

export default Footer;
