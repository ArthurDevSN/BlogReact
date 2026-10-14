import styles from './CreatePost.module.css';

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthValue } from '../../context/AuthContext';
import { useInsertDocument } from '../../hooks/useInsertDocuments';
import { validatePost } from '../../utils/postValidation';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [formError, setFormError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  const { user } = useAuthValue();
  const { insertDocument, response } = useInsertDocument('post');
  const navigate = useNavigate();
  const loading = saving || response.loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current || response.loading) return;
    setFormError('');
    setSubmitError('');

    const { data, error } = validatePost({ title, image, body, tags });
    if (error) {
      setFormError(error);
      return;
    }

    if (!user) {
      setFormError('Entre na sua conta para criar um post.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    try {
      const createdPost = await insertDocument({
        ...data,
        uid: user.uid,
        createdBy: user.displayName?.trim().slice(0, 80) || 'Autor',
      });

      if (createdPost) {
        navigate('/');
      } else {
        setSubmitError('Não foi possível cadastrar o post. Tente novamente.');
      }
    } catch {
      setSubmitError('Não foi possível cadastrar o post. Tente novamente.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className={styles.create_post}>
      <h1>Criar Post</h1>
      <p>Escreva sobre o que quiser e compartilhe o seu conhecimento!</p>
      <form onSubmit={handleSubmit} aria-busy={loading} aria-label="Criar post">
        <label>
          <span>Título:</span>
          <input type="text" name="title" required maxLength={200}
            placeholder="Pense em um bom título..."
            onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label>
          <span>URL da imagem:</span>
          <input type="url" name="image" required maxLength={2048}
            placeholder="Insira uma imagem que representa o seu post"
            onChange={(event) => setImage(event.target.value)} value={image} />
        </label>
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
        <button className="btn" disabled={loading}>
          {loading ? 'Aguarde...' : 'Cadastrar'}
        </button>
        {(formError || response.error || submitError) && <p className="error" role="alert">{formError || response.error || submitError}</p>}
      </form>
    </div>
  );
};

export default CreatePost;
