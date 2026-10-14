import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

const mockCreateUser = jest.fn();
jest.mock('../../hooks/useAuthentication', () => ({
  useAuthentication: () => ({ createUser: mockCreateUser, error: null, loading: false }),
}));

beforeEach(() => mockCreateUser.mockReset());

function fillForm({ name = 'Autora', confirmation = 'secret1' } = {}) {
  render(<MemoryRouter><Register /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Nome:'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('E-mail:'), { target: { value: 'author@example.com' } });
  fireEvent.change(screen.getByLabelText('Senha:'), { target: { value: 'secret1' } });
  fireEvent.change(screen.getByLabelText('Confirmação de senha:'), { target: { value: confirmation } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
}

test('impede cadastro quando as senhas são diferentes', () => {
  fillForm({ confirmation: 'different' });
  expect(screen.getByRole('alert')).toHaveTextContent('As senhas precisam ser iguais');
  expect(mockCreateUser).not.toHaveBeenCalled();
});

test('impede cadastro com nome formado somente por espaços', () => {
  fillForm({ name: '   ' });
  expect(screen.getByRole('alert')).toHaveTextContent('Informe seu nome');
  expect(mockCreateUser).not.toHaveBeenCalled();
});

test('envia cadastro válido e identifica os campos para preenchimento automático', () => {
  fillForm();
  expect(mockCreateUser).toHaveBeenCalledWith({
    displayName: 'Autora', email: 'author@example.com', password: 'secret1',
  });
  expect(screen.getByLabelText('Senha:')).toHaveAttribute('autocomplete', 'new-password');
});
