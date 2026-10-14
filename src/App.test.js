import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from 'firebase/auth';
import App from './App';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
}));
jest.mock('./firebase/config', () => ({ auth: { name: 'test-auth' } }));
jest.mock('./components/Navbar', () => () => <nav aria-label="Navegação principal" />);
jest.mock('./components/Footer', () => () => <footer>Rodapé</footer>);
jest.mock('./pages/Home/Home', () => () => <h1>Início</h1>);
jest.mock('./pages/About/About', () => () => <h1>Sobre</h1>);
jest.mock('./pages/Login/Login', () => () => <h1>Entrar</h1>);
jest.mock('./pages/CreatePost/CreatePost', () => () => <h1>Criar publicação</h1>);
jest.mock('./pages/Dashboard/Dashboard', () => () => <h1>Minhas publicações</h1>);
jest.mock('./pages/Search/Search', () => () => <h1>Busca</h1>);
jest.mock('./pages/Post/Post', () => () => <h1>Publicação</h1>);
jest.mock('./pages/EditPost/EditPost', () => () => <h1>Editar publicação</h1>);

let authNext;
let authFailure;
let unsubscribe;

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/');
  unsubscribe = jest.fn();
  onAuthStateChanged.mockImplementation((auth, next, failure) => {
    authNext = next;
    authFailure = failure;
    return unsubscribe;
  });
});

test('aguarda a sessão e exibe conteúdo público com acesso direto ao conteúdo', () => {
  render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Carregando');
  act(() => authNext(null));
  expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument();
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#main-content');
});

test('restaura a rota protegida após login e preserva os parâmetros', () => {
  window.history.replaceState({}, '', '/posts/edit/post-1?draft=1#form');
  render(<App />);
  act(() => authNext(null));
  expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
  act(() => authNext({ uid: 'author-1' }));
  expect(screen.getByRole('heading', { name: 'Editar publicação' })).toBeInTheDocument();
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/posts/edit/post-1?draft=1#form');
});

test('redireciona usuário autenticado da tela de login ao início', () => {
  window.history.replaceState({}, '', '/login');
  render(<App />);
  act(() => authNext({ uid: 'author-1' }));
  expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/');
});

test('exibe uma página 404 para endereços desconhecidos', () => {
  window.history.replaceState({}, '', '/pagina-inexistente');
  render(<App />);
  act(() => authNext(null));
  expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
});

test('cancela os observadores também durante a remontagem do StrictMode', () => {
  const { unmount } = render(<StrictMode><App /></StrictMode>);
  expect(onAuthStateChanged).toHaveBeenCalledTimes(2);
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(2);
});

test('permite tentar novamente quando a verificação de sessão falha', () => {
  render(<App />);
  act(() => authFailure(new Error('offline')));
  expect(screen.getByRole('alert')).toHaveTextContent('Verifique sua conexão');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  expect(onAuthStateChanged).toHaveBeenCalledTimes(2);
  act(() => authNext(null));
  expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument();
});

function submitRegistration() {
  fireEvent.change(screen.getByLabelText('Nome:'), { target: { value: 'Autora' } });
  fireEvent.change(screen.getByLabelText('E-mail:'), { target: { value: 'author@example.com' } });
  fireEvent.change(screen.getByLabelText('Senha:'), { target: { value: 'secret1' } });
  fireEvent.change(screen.getByLabelText('Confirmação de senha:'), { target: { value: 'secret1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
}

test('mantém cadastro visível até salvar perfil apesar do evento imediato de autenticação', async () => {
  window.history.replaceState({}, '', '/register');
  const user = { uid: 'author-1', email: 'author@example.com' };
  let finishProfile;
  createUserWithEmailAndPassword.mockImplementation(async () => {
    authNext(user);
    return { user };
  });
  updateProfile.mockImplementation(() => new Promise((resolve) => { finishProfile = resolve; }));
  render(<App />);
  act(() => authNext(null));
  await act(async () => { submitRegistration(); });
  expect(screen.getByRole('heading', { name: 'Cadastrar-se para postar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Aguarde...' })).toBeDisabled();
  await act(async () => { finishProfile(); });
  expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument();
});

test('falha ao salvar nome pode ser corrigida sem tentar criar a mesma conta de novo', async () => {
  window.history.replaceState({}, '', '/register');
  const user = { uid: 'author-1', email: 'author@example.com' };
  createUserWithEmailAndPassword.mockImplementation(async () => {
    authNext(user);
    return { user };
  });
  updateProfile.mockRejectedValueOnce({ code: 'auth/network-request-failed' }).mockResolvedValueOnce(undefined);
  render(<App />);
  act(() => authNext(null));
  await act(async () => { submitRegistration(); });
  expect(screen.getByRole('alert')).toHaveTextContent('Sua conta foi criada');
  expect(screen.getByLabelText('E-mail:')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));
  expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument();
  expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
  expect(updateProfile).toHaveBeenCalledTimes(2);
});
