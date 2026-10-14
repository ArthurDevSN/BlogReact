import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthValue } from '../../context/AuthContext';
import { useFetchDocument } from '../../hooks/useFetchDocument';
import { useUpdateDocument } from '../../hooks/useUpdateDocument';
import EditPost from './EditPost';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(), useParams: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));
jest.mock('../../context/AuthContext');
jest.mock('../../hooks/useFetchDocument');
jest.mock('../../hooks/useUpdateDocument');

const navigate = jest.fn();
const updateDocument = jest.fn();
const post = {
  title: 'Meu post', image: 'https://example.com/image.jpg', body: 'Conteúdo',
  tagsArray: ['react', 'js'], uid: 'owner', createdBy: 'Autor original',
};

beforeEach(() => {
  jest.clearAllMocks();
  useNavigate.mockReturnValue(navigate);
  useParams.mockReturnValue({ id: 'post-1' });
  useAuthValue.mockReturnValue({ user: { uid: 'owner', displayName: 'Ana' } });
  useFetchDocument.mockReturnValue({ document: post, loading: false, error: null });
  useUpdateDocument.mockReturnValue({ updateDocument, response: { loading: false, error: null } });
});

test('bloqueia edição de post de outro autor', () => {
  useAuthValue.mockReturnValue({ user: { uid: 'another-user' } });
  render(<EditPost />);
  expect(screen.getByRole('alert')).toHaveTextContent('só pode editar os seus próprios posts');
  expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  expect(updateDocument).not.toHaveBeenCalled();
});

test('exibe carregamento, erro e post ausente sem oferecer edição', () => {
  useFetchDocument.mockReturnValue({ document: null, loading: true, error: null });
  const { rerender } = render(<EditPost />);
  expect(screen.getByRole('status')).toHaveTextContent('Carregando post');

  useFetchDocument.mockReturnValue({ document: null, loading: false, error: 'Falha ao carregar o post.' });
  rerender(<EditPost />);
  expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar o post.');

  useFetchDocument.mockReturnValue({ document: null, loading: false, error: null });
  rerender(<EditPost />);
  expect(screen.getByRole('alert')).toHaveTextContent('Post não encontrado.');
  expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
});

test('aguarda atualização e mantém alterações disponíveis quando falha', async () => {
  let finishSaving;
  updateDocument.mockReturnValue(new Promise((resolve) => { finishSaving = resolve; }));
  render(<EditPost />);
  fireEvent.change(screen.getByLabelText('Título:'), { target: { value: 'Título atualizado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  expect(screen.getByRole('button', { name: 'Aguarde...' })).toBeDisabled();
  expect(navigate).not.toHaveBeenCalled();

  await act(async () => { finishSaving(false); });
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível editar');
  expect(screen.getByLabelText('Título:')).toHaveValue('Título atualizado');
  expect(navigate).not.toHaveBeenCalled();
});

test('atualiza somente conteúdo e navega após sucesso', async () => {
  updateDocument.mockResolvedValue(true);
  render(<EditPost />);
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard'));
  expect(updateDocument).toHaveBeenCalledWith('post-1', {
    title: post.title, image: post.image, body: post.body, tagsArray: post.tagsArray,
  });
});

test('exibe o motivo da falha de edição em vez de substituir por mensagem genérica', async () => {
  updateDocument.mockResolvedValue(false);
  useUpdateDocument.mockReturnValue({ updateDocument, response: { loading: false, error: 'O post foi removido.' } });
  render(<EditPost />);
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Editar' })).toBeEnabled());
  expect(screen.getByRole('alert')).toHaveTextContent('O post foi removido.');
  expect(navigate).not.toHaveBeenCalled();
});
