import styles from './Home.module.css';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useFetchDocuments } from '../../hooks/useFetchDocuments';
import PostDetail from '../../components/PostDetail';

const Home = () => {
  const [query, setQuery] = useState('');
  const { documents: posts, loading, error, fromCache } = useFetchDocuments('post');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const search = query.trim().toLowerCase();
    if (search) navigate(`/search?${new URLSearchParams({ q: search })}`);
  };

  return (
    <div className={styles.home}>
      <h1>Veja os nossos posts mais recentes</h1>
      <form onSubmit={handleSubmit} className={styles['search-form']} role="search">
        <input
          type="search"
          name="q"
          aria-label="Buscar por tag"
          placeholder="Ou busque por tags..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          required
        />
        <button className="btn btn-dark" disabled={!query.trim()}>Pesquisar</button>
      </form>
      <div aria-busy={loading}>
        {loading && <p role="status">Carregando posts...</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {!loading && !error && fromCache && <p role="status">{posts?.length ? 'Mostrando posts salvos neste navegador. Eles podem estar desatualizados.' : 'Aguardando confirmação dos posts. Verifique sua conexão se a espera continuar.'}</p>}
        {!loading && !error && posts?.map((post) => <PostDetail key={post.id} post={post} />)}
        {!loading && !error && !fromCache && posts?.length === 0 && (
          <div className={styles.noposts}>
            <p>Não foram encontrados posts.</p>
            <Link to="/posts/create" className="btn">Criar primeiro post</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
