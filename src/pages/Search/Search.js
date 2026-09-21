import styles from './Search.module.css';

import { useFetchDocuments } from '../../hooks/useFetchDocuments';
import { useQuery } from '../../hooks/useQuery';

// components

import PostDetail from '../../components/PostDetail';

import { Link } from 'react-router-dom';


const Search = () => {
    const params = useQuery();
    const search = params.get("q")

    const { documents: posts } = useFetchDocuments("post", search);

    return (
        <div className={styles.search_container}>
            <h2>Search</h2>
            <div>
                {posts && posts.lenght === 0 && (
                <>
                    <p>Não foram encontrados posts a partir da sua busca...</p>
                    <Link to="/" className="btn btn-dark">
                        Voltar
                    </Link>
                </>
                )}
                {posts && posts.map((post) => <PostDetail key={post.id} post={post} />)}
            </div>
        </div>
    );
}

export default Search;
