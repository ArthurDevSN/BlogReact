import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuthValue } from '../../context/AuthContext';
import { useFetchDocuments } from '../../hooks/useFetchDocuments';
import { useDeleteDocument } from '../../hooks/useDeleteDocument';
import Dashboard from './Dashboard';

jest.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));
jest.mock('../../context/AuthContext');
jest.mock('../../hooks/useFetchDocuments');
jest.mock('../../hooks/useDeleteDocument');

const deleteDocument = jest.fn();
const posts = [{ id: 'post-1', title: 'Meu post', uid: 'owner' }];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  useAuthValue.mockReturnValue({ user: { uid: 'owner' } });
  useFetchDocuments.mockReturnValue({ documents: posts, loading: false, error: null });
  useDeleteDocument.mockReturnValue({ deleteDocument, response: { loading: false, error: null } });
});

afterEach(() => { jest.restoreAllMocks(); });

test('cancelar confirmação mantém o post sem solicitar exclusão', () => {
  window.confirm.mockReturnValue(false);
  render(<Dashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Excluir post: Meu post' }));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Meu post'));
  expect(deleteDocument).not.toHaveBeenCalled();
});

test('desabilita exclusão durante requisição e mantém erro após falha', async () => {
  let finishDeleting;
  deleteDocument.mockReturnValue(new Promise((resolve) => { finishDeleting = resolve; }));
  render(<Dashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Excluir post: Meu post' }));
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByRole('button')).toHaveTextContent('Excluindo...');
  fireEvent.click(screen.getByRole('button'));
  expect(deleteDocument).toHaveBeenCalledTimes(1);

  await act(async () => { finishDeleting(false); });
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível excluir');
  expect(screen.getByRole('button')).toBeEnabled();
  expect(screen.getByText('Meu post')).toBeInTheDocument();
});

test('informa exclusão confirmada pelo servidor', async () => {
  deleteDocument.mockResolvedValue(true);
  render(<Dashboard />);
  fireEvent.click(screen.getByRole('button'));
  expect(deleteDocument).toHaveBeenCalledWith('post-1');
  expect(await screen.findByRole('status')).toHaveTextContent('Post excluído com sucesso.');
});

test('exibe carregamento e erro de consulta sem mostrar ausência de posts', () => {
  useFetchDocuments.mockReturnValue({ documents: null, loading: true, error: null });
  const { rerender } = render(<Dashboard />);
  expect(screen.getByRole('status')).toHaveTextContent('Carregando posts');
  expect(screen.queryByText('Título')).not.toBeInTheDocument();

  useFetchDocuments.mockReturnValue({ documents: [], loading: false, error: 'Falha ao carregar seus posts.' });
  rerender(<Dashboard />);
  expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar seus posts.');
  expect(screen.queryByText('Não foram encontrados posts')).not.toBeInTheDocument();
});

test('cache vazio aguarda confirmação sem afirmar que não existem posts', () => {
  useFetchDocuments.mockReturnValue({ documents: [], loading: false, error: null, fromCache: true });
  render(<Dashboard />);
  expect(screen.getByRole('status')).toHaveTextContent('Aguardando confirmação dos posts.');
  expect(screen.queryByText('Não foram encontrados posts')).not.toBeInTheDocument();
});

test('preserva mensagem específica de falha na exclusão', async () => {
  deleteDocument.mockResolvedValue(false);
  useDeleteDocument.mockReturnValue({ deleteDocument, response: { loading: false, error: 'Você não tem permissão.' } });
  render(<Dashboard />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
  expect(screen.getByRole('alert')).toHaveTextContent('Você não tem permissão.');
});
