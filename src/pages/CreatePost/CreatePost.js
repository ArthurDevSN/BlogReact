import styles from './CreatePost.module.css';

import { React, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthValue } from '../../context/AuthContext';
import { useInsertDocument} from '../../hooks/useInsertDocuments';

const CreatePost = () => {

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState("");

  const {user} = useAuthValue();

  const {insertDocument, response} = useInsertDocument("post");

  const navigate = useNavigate();

  const HandleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    try{
      new URL(image)
    } catch (error) {
      setFormError("A imagem precisa ser uma URL");
      return;
    }

    const tagsArray = tags.split(",").map((tag) => tag.trim().toLowerCase());

    if (!title || !image|| !tags|| !body) {
      setFormError("Por favor, preencha todos os campos!");
      return;
    }
      


    insertDocument({
      title,
      image,
      body,
      tagsArray,
      uid: user.uid,
      createdBy: user.displayName,
    });

    navigate("/");
  }


  return (
    <div className={styles.create_post}>
      <h2>Criar Post</h2>
      <p>Escreva sobre o que quiser e compartilhe o seu conhecimento !</p>
    <form onSubmit={HandleSubmit}>
      <label>
         <span>Título:</span>
         <input type="text"
         name = "title"
         required placeholder='Pense em um bom título...'
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          />
      </label>
        <label>
         <span>URL da imagem:</span>
         <input type="text"
         name = "image"
         placeholder='Insira uma image que representa o seu post'
          onChange={(e) => setImage(e.target.value)}
          value={image}
          />
      </label>
       <label>
         <span>Conteúdo:</span>
         <textarea
         name = "body"
         required placeholder='Insira o conteúdo do post'
          onChange={(e) => setBody(e.target.value)}
          value={body}
          />
      </label>
       <label>
         <span>Tags:</span>
         <input type="text"
         name = "tags"
         placeholder='Insira tags em seu post'
          onChange={(e) => setTags(e.target.value)}
          value={tags}
          />
      </label>
       {!response.loading && <button className='btn'>Cadastrar</button>}
        {response.loading && (<button className='btn' disabled>Aguarde...</button>)}
        {response.error && <p className="error">{response.error}</p>}
        {formError && <p className="error">{formError}</p>}
    </form>
    </div>
  );
};

export default CreatePost;
