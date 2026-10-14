import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const mockLogout = jest.fn();
let mockAuthState;
jest.mock('../hooks/useAuthentication', () => ({ useAuthentication: () => mockAuthState }));
jest.mock('../context/AuthContext', () => ({ useAuthValue: () => ({ user: { uid: 'author-1' } }) }));

beforeEach(() => {
  mockLogout.mockReset();
  mockAuthState = { logout: mockLogout, loading: false, error: null };
});

test('aciona logout e permite reenviar após uma falha visível', () => {
  mockAuthState.error = 'Não foi possível conectar.';
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar.');
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
  expect(mockLogout).toHaveBeenCalledTimes(1);
});

test('impede cliques repetidos enquanto aguarda logout', () => {
  mockAuthState.loading = true;
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  const button = screen.getByRole('button', { name: 'Saindo...' });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(mockLogout).not.toHaveBeenCalled();
});
