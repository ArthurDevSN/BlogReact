import styles from './Search.module.css';
import { Link } from 'react-router-dom';
import { useFetchDocuments } from '../../hooks/useFetchDocuments';
import { useQuery } from '../../hooks/useQuery';
import PostDetail from '../../components/PostDetail';

const SearchResults = ({ search }) => {
  const { documents: posts, loading, error, fromCache } = useFetchDocuments('post', search);

  return (
    <div aria-busy={loading}>
      {loading && <p role="status">Buscando posts...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && fromCache && <p role="status">{posts?.length ? 'Mostrando posts salvos neste navegador. Eles podem estar desatualizados.' : 'Aguardando confirmação dos posts. Verifique sua conexão se a espera continuar.'}</p>}
      {!loading && !error && !fromCache && posts?.length === 0 && (
        <p role="status">Não foram encontrados posts para esta tag.</p>
      )}
      {!loading && !error && posts?.map((post) => <PostDetail key={post.id} post={post} />)}
    </div>
  );
};

const Search = () => {
  const params = useQuery();
  const search = (params.get('q') || '').trim().toLowerCase();

  return (
    <div className={styles.search_container}>
      <h1>{search ? `Resultados para: ${search}` : 'Buscar posts'}</h1>
      {search ? <SearchResults key={search} search={search} /> : <p>Informe uma tag na busca da página inicial.</p>}
      <Link to="/" className="btn btn-dark">Voltar para o início</Link>
    </div>
  );
};

export default Search;
