import styles from './EditPost.module.css';

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthValue } from '../../context/AuthContext';
import { useFetchDocument } from '../../hooks/useFetchDocument';
import { useUpdateDocument } from '../../hooks/useUpdateDocument';
import { validatePost } from '../../utils/postValidation';

const EditPost = () => {
  const { id } = useParams();
  const { document: post, loading: loadingPost, error: fetchError } = useFetchDocument('post', id);
  const { user } = useAuthValue();
  const { updateDocument, response } = useUpdateDocument('post');
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [formError, setFormError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const isOwner = Boolean(user && post && user.uid === post.uid);
  const loading = saving || response.loading;

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setBody(post.body || '');
      setImage(post.image || '');
      setTags(Array.isArray(post.tagsArray) ? post.tagsArray.join(', ') : '');
      setFormError('');
    }
  }, [post]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current || response.loading) return;
    setFormError('');
    setSubmitError('');

    if (!isOwner) {
      setFormError('Você só pode editar os seus próprios posts.');
      return;
    }

    const { data, error } = validatePost({ title, image, body, tags });
    if (error) {
      setFormError(error);
      return;
    }

    submitting.current = true;
    setSaving(true);
    try {
      const updated = await updateDocument(id, data);
      if (updated) {
        navigate('/dashboard');
      } else {
        setSubmitError('Não foi possível editar o post. Tente novamente.');
      }
    } catch {
      setSubmitError('Não foi possível editar o post. Tente novamente.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  if (loadingPost) {
    return <div className={styles.edit_post}><p role="status">Carregando post...</p></div>;
  }

  if (fetchError || !post) {
    return (
      <div className={styles.edit_post}>
        <p role="alert" className={fetchError ? 'error' : undefined}>{fetchError || 'Post não encontrado.'}</p>
        <Link to="/dashboard" className="btn btn-outline">Voltar ao dashboard</Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className={styles.edit_post}>
        <p role="alert" className="error">Você só pode editar os seus próprios posts.</p>
        <Link to="/dashboard" className="btn btn-outline">Voltar ao dashboard</Link>
      </div>
    );
  }

  return (
    <div className={styles.edit_post}>
      <h1>Editando post: {post.title}</h1>
      <p>Altere os dados do post como desejar!</p>
      <form onSubmit={handleSubmit} aria-busy={loading}>
        <label>
          <span>Título:</span>
          <input type="text" name="title" required maxLength={200} placeholder="Pense em um bom título..."
            onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label>
          <span>URL da imagem:</span>
          <input type="url" name="image" required maxLength={2048} placeholder="Insira uma imagem que representa o seu post"
            onChange={(event) => setImage(event.target.value)} value={image} />
        </label>
        <p className={styles.preview_title}>Imagem atual:</p>
        <img className={styles.image_preview} src={post.image} alt={post.title} />
        <label>
          <span>Conteúdo:</span>
          <textarea name="body" required maxLength={50000} placeholder="Insira o conteúdo do post"
            onChange={(event) => setBody(event.target.value)} value={body} />
        </label>
        <label>
          <span>Tags:</span>
          <input type="text" name="tags" required placeholder="Separe as tags por vírgulas"
            onChange={(event) => setTags(event.target.value)} value={tags} />
        </label>
        <button className="btn" disabled={loading}>{loading ? 'Aguarde...' : 'Editar'}</button>
        {(formError || response.error || submitError) && <p className="error" role="alert">{formError || response.error || submitError}</p>}
      </form>
    </div>
  );
};

export default EditPost;
