import styles from './Post.module.css';
import { Link, useParams } from 'react-router-dom';
import { useFetchDocument } from '../../hooks/useFetchDocument';

const Post = () => {
  const { id } = useParams();
  const { document: post, loading, error } = useFetchDocument('post', id);

  return (
    <article className={styles.post_container} aria-busy={loading}>
      {loading && <p role="status">Carregando post...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && !post && (
        <>
          <h1>Post não encontrado</h1>
          <p>Este post pode ter sido removido.</p>
        </>
      )}
      {!loading && !error && post && (
        <>
          <h1>{post.title}</h1>
          <p>Por {post.createdBy || 'Autor'}</p>
          <img src={post.image} alt={post.title} decoding="async" />
          <p>{post.body}</p>
          {post.tagsArray?.length > 0 && (
            <>
              <h2>Este post trata sobre:</h2>
              <div className={styles.tags}>
                {Array.from(new Set(post.tagsArray)).map((tag) => (
                  <Link key={tag} to={`/search?${new URLSearchParams({ q: tag })}`}>#{tag}</Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <Link to="/" className="btn btn-outline">Voltar para o início</Link>
    </article>
  );
};

export default Post;
