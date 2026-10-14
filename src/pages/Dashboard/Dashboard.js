import styles from './Dashboard.module.css';

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthValue } from '../../context/AuthContext';
import { useFetchDocuments } from '../../hooks/useFetchDocuments';
import { useDeleteDocument } from '../../hooks/useDeleteDocument';

const Dashboard = () => {
  const { user } = useAuthValue();
  const { documents: posts, loading, error, fromCache } = useFetchDocuments('post', null, user?.uid);
  const { deleteDocument, response } = useDeleteDocument('post');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [message, setMessage] = useState('');
  const deleting = useRef(false);

  const handleDelete = async (post) => {
    if (deleting.current || response.loading) return;
    if (!window.confirm(`Excluir o post "${post.title}"? Esta ação não pode ser desfeita.`)) return;

    deleting.current = true;
    setDeletingId(post.id);
    setDeleteError('');
    setMessage('');
    try {
      const deleted = await deleteDocument(post.id);
      if (deleted) {
        setMessage('Post excluído com sucesso.');
      } else {
        setDeleteError('Não foi possível excluir o post. Tente novamente.');
      }
    } catch {
      setDeleteError('Não foi possível excluir o post. Tente novamente.');
    } finally {
      deleting.current = false;
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      <p>Gerencie os seus posts</p>
      {loading && <p role="status">Carregando posts...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {(response.error || deleteError) && <p className="error" role="alert">{response.error || deleteError}</p>}
      {!loading && !error && fromCache && <p role="status">{posts?.length ? 'Mostrando posts salvos neste navegador. Eles podem estar desatualizados.' : 'Aguardando confirmação dos posts. Verifique sua conexão se a espera continuar.'}</p>}
      {message && <p role="status">{message}</p>}
      {!loading && !error && !fromCache && posts && posts.length === 0 && (
        <div className={styles.noposts}>
          <p>Não foram encontrados posts</p>
          <Link to="/posts/create" className="btn">Criar primeiro post</Link>
        </div>
      )}
      {!loading && !error && posts && posts.length > 0 && (
        <>
          <div className={styles.post_header}>
            <span>Título</span>
            <span>Ações</span>
          </div>
          {posts.map((post) => (
            <div className={styles.post_row} key={post.id}>
              <p>{post.title}</p>
              <div className={styles.actions}>
                <Link to={`/posts/${post.id}`} className="btn btn-outline">Ver</Link>
                <Link to={`/posts/edit/${post.id}`} className="btn btn-outline">Editar</Link>
                <button onClick={() => handleDelete(post)} disabled={Boolean(deletingId) || response.loading}
                  className="btn btn-outline btn-danger" aria-label={`Excluir post: ${post.title}`}>
                  {deletingId === post.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default Dashboard;
