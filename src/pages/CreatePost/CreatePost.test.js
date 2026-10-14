import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useAuthValue } from '../../context/AuthContext';
import { useInsertDocument } from '../../hooks/useInsertDocuments';
import CreatePost from './CreatePost';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn() }));
jest.mock('../../context/AuthContext');
jest.mock('../../hooks/useInsertDocuments');

const navigate = jest.fn();
const insertDocument = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useNavigate.mockReturnValue(navigate);
  useAuthValue.mockReturnValue({ user: { uid: 'owner', displayName: ' Ana ' } });
  useInsertDocument.mockReturnValue({ insertDocument, response: { loading: false, error: null } });
});

const fillForm = () => {
  fireEvent.change(screen.getByLabelText('Título:'), { target: { value: ' Meu post ' } });
  fireEvent.change(screen.getByLabelText('URL da imagem:'), { target: { value: 'https://example.com/image.jpg' } });
  fireEvent.change(screen.getByLabelText('Conteúdo:'), { target: { value: ' Meu conteúdo ' } });
  fireEvent.change(screen.getByLabelText('Tags:'), { target: { value: 'React, , react, JS' } });
};

test('aguarda o cadastro, impede duplicatas e permanece no formulário quando há falha', async () => {
  let finishSaving;
  insertDocument.mockReturnValue(new Promise((resolve) => { finishSaving = resolve; }));
  render(<CreatePost />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  expect(screen.getByRole('button', { name: 'Aguarde...' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'Criar post' }));
  expect(insertDocument).toHaveBeenCalledTimes(1);
  expect(navigate).not.toHaveBeenCalled();

  await act(async () => { finishSaving(null); });
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível cadastrar');
  expect(screen.getByLabelText('Título:')).toHaveValue(' Meu post ');
  expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  expect(navigate).not.toHaveBeenCalled();
});

test('navega apenas após cadastro confirmado e envia dados normalizados', async () => {
  insertDocument.mockResolvedValue({ id: 'created-post' });
  render(<CreatePost />);
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'));
  expect(insertDocument).toHaveBeenCalledWith({
    title: 'Meu post', image: 'https://example.com/image.jpg', body: 'Meu conteúdo',
    tagsArray: ['react', 'js'], uid: 'owner', createdBy: 'Ana',
  });
});

test('rejeita título com espaços antes de tentar salvar', () => {
  render(<CreatePost />);
  fillForm();
  fireEvent.change(screen.getByLabelText('Título:'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  expect(screen.getByRole('alert')).toHaveTextContent('preencha todos os campos');
  expect(insertDocument).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});

test('exibe a causa da falha de salvamento e mantém validação de campos prioritária', async () => {
  insertDocument.mockResolvedValue(null);
  useInsertDocument.mockReturnValue({ insertDocument, response: { loading: false, error: 'Verifique sua conexão.' } });
  render(<CreatePost />);
  fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled());
  expect(screen.getByRole('alert')).toHaveTextContent('Verifique sua conexão.');
  expect(navigate).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText('Título:'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  expect(screen.getByRole('alert')).toHaveTextContent('preencha todos os campos');
});
