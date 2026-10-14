import styles from './PostDetail.module.css'

import {Link} from 'react-router-dom'

const PostDetail = ({post}) => {
    return (
        <article className={styles.post_detail}>
            <img src={post.image} alt={post.title} loading="lazy" decoding="async" />
            <h2>{post.title}</h2>
            <p className={styles.createdBy}>Por {post.createdBy || 'Autor'}</p>
            <div className={styles.tags}>
                {Array.from(new Set(post.tagsArray || [])).map((tag) => (
                    <Link key={tag} to={`/search?${new URLSearchParams({ q: tag })}`}>
                        <span>#</span>{tag}
                    </Link>
                ))}
            </div>
            <Link to={`/posts/${post.id}`} className='btn btn-outline' aria-label={`Ler ${post.title}`}>Ler</Link>
        </article>
    );
};

export default PostDetail;

