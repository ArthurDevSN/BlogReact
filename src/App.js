import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import About from './pages/About/About';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import CreatePost from './pages/CreatePost/CreatePost';
import Dashboard from './pages/Dashboard/Dashboard';
import Search from './pages/Search/Search';
import Post from './pages/Post/Post';
import EditPost from './pages/EditPost/EditPost';
import './App.css';

function RequireAuth({ user, children }) {
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function GuestRoute({ user, children }) {
  const location = useLocation();
  const from = location.state?.from;
  const destination = from?.pathname?.startsWith('/') && !from.pathname.startsWith('//')
    && !['/login', '/register'].includes(from.pathname.toLowerCase())
    ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/';
  return user ? <Navigate to={destination} replace /> : children;
}

function App() {
  const [user, setUser] = useState(undefined);
  const [authError, setAuthError] = useState(false);
  const [authAttempt, setAuthAttempt] = useState(0);
  const [registration, setRegistration] = useState({ pending: false, user: null, busy: false });
  const visibleUser = registration.pending ? null : user;

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (active) {
        setUser(currentUser);
        setAuthError(false);
      }
    }, () => {
      if (active) setAuthError(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [authAttempt]);

  if (authError) {
    return (
      <main className="container route-status">
        <h1>Não foi possível verificar seu acesso</h1>
        <p role="alert">Verifique sua conexão e tente novamente.</p>
        <button className="btn" onClick={() => {
          setAuthError(false);
          setUser(undefined);
          setAuthAttempt((attempt) => attempt + 1);
        }}>Tentar novamente</button>
      </main>
    );
  }

  if (user === undefined) {
    return <main className="container route-status"><p role="status">Carregando...</p></main>;
  }

  return (
    <div className="App">
      <AuthProvider value={{ user: visibleUser, registration, setRegistration }}>
        <BrowserRouter>
          <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
          <Navbar />
          <main className="container" id="main-content" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/search" element={<Search />} />
              <Route path="/posts/:id" element={<Post />} />
              <Route path="/login" element={<GuestRoute user={visibleUser}><Login /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute user={visibleUser}><Register /></GuestRoute>} />
              <Route path="/posts/create" element={<RequireAuth user={visibleUser}><CreatePost /></RequireAuth>} />
              <Route path="/posts/edit/:id" element={<RequireAuth user={visibleUser}><EditPost /></RequireAuth>} />
              <Route path="/dashboard" element={<RequireAuth user={visibleUser}><Dashboard /></RequireAuth>} />
              <Route path="*" element={(
                <div className="route-status">
                  <h1>Página não encontrada</h1>
                  <p>O endereço pode ter mudado ou não existe.</p>
                  <Link to="/" className="btn">Voltar ao início</Link>
                </div>
              )} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
