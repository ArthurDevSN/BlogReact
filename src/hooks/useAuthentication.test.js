import { StrictMode, useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { useAuthentication } from './useAuthentication';
import { auth } from '../firebase/config';
import { AuthProvider } from '../context/AuthContext';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
}));
jest.mock('../firebase/config', () => ({ auth: { name: 'test-auth' } }));

beforeEach(() => jest.resetAllMocks());

const credentials = { email: ' author@example.com ', password: ' secret ' };

test('login funciona no StrictMode, normaliza e-mail e mantém a senha intacta', async () => {
  const user = { uid: 'author-1' };
  signInWithEmailAndPassword.mockResolvedValue({ user });
  const { result } = renderHook(useAuthentication, { wrapper: StrictMode });
  let response;
  await act(async () => { response = await result.current.login(credentials); });
  expect(response).toBe(user);
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'author@example.com', ' secret ');
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
});

test('cadastro só retorna após salvar o nome do perfil', async () => {
  const user = { uid: 'author-1' };
  let finishProfile;
  createUserWithEmailAndPassword.mockResolvedValue({ user });
  updateProfile.mockImplementation(() => new Promise((resolve) => { finishProfile = resolve; }));
  const { result } = renderHook(useAuthentication);
  let registration;
  await act(async () => {
    registration = result.current.createUser({ ...credentials, displayName: ' Author ' });
    await Promise.resolve();
  });
  expect(result.current.loading).toBe(true);
  expect(updateProfile).toHaveBeenCalledWith(user, { displayName: 'Author' });
  await act(async () => {
    finishProfile();
    expect(await registration).toBe(user);
  });
  expect(result.current.loading).toBe(false);
});

test.each([
  ['auth/invalid-credential', 'E-mail ou senha incorretos.'],
  ['auth/network-request-failed', 'Não foi possível conectar. Verifique sua conexão e tente novamente.'],
  ['auth/too-many-requests', 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.'],
])('traduz o código %s sem depender da mensagem do SDK', async (code, message) => {
  signInWithEmailAndPassword.mockRejectedValue({ code, message: 'unrelated SDK detail' });
  const { result } = renderHook(useAuthentication);
  await act(async () => { expect(await result.current.login(credentials)).toBeNull(); });
  expect(result.current.error).toBe(message);
  expect(result.current.loading).toBe(false);
});

test('bloqueia envio duplicado enquanto uma operação está pendente', async () => {
  let resolveLogin;
  signInWithEmailAndPassword.mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve; }));
  const { result } = renderHook(useAuthentication);
  let request;
  await act(async () => {
    request = result.current.login(credentials);
    expect(await result.current.login(credentials)).toBeNull();
  });
  expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
  expect(result.current.loading).toBe(true);
  await act(async () => {
    resolveLogin({ user: { uid: 'author-1' } });
    await request;
  });
  expect(result.current.loading).toBe(false);
});

test('logout captura erros e permite tentar novamente', async () => {
  signOut.mockRejectedValueOnce({ code: 'auth/network-request-failed' }).mockResolvedValueOnce(undefined);
  const { result } = renderHook(useAuthentication);
  await act(async () => { expect(await result.current.logout()).toBeNull(); });
  expect(result.current.error).toMatch(/conexão/);
  await act(async () => { expect(await result.current.logout()).toBe(true); });
  expect(result.current.error).toBeNull();
  expect(result.current.loading).toBe(false);
});

test('ignora ações e conclusões depois da desmontagem', async () => {
  let rejectLogin;
  signInWithEmailAndPassword.mockImplementation(() => new Promise((resolve, reject) => { rejectLogin = reject; }));
  const { result, unmount } = renderHook(useAuthentication);
  let request;
  act(() => { request = result.current.login(credentials); });
  const login = result.current.login;
  unmount();
  await act(async () => {
    rejectLogin({ code: 'auth/invalid-credential' });
    expect(await request).toBeNull();
    expect(await login(credentials)).toBeNull();
  });
  expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
});

test('um cadastro pendente bloqueia outro login mesmo em uma instância diferente do hook', async () => {
  let finishCreation;
  createUserWithEmailAndPassword.mockImplementation(() => new Promise((resolve) => { finishCreation = resolve; }));
  updateProfile.mockResolvedValue(undefined);
  signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'another-author' } });
  function Wrapper({ children }) {
    const [registration, setRegistration] = useState({ pending: false, user: null, busy: false });
    return <AuthProvider value={{ registration, setRegistration }}>{children}</AuthProvider>;
  }
  const { result } = renderHook(() => ({ register: useAuthentication(), login: useAuthentication() }), { wrapper: Wrapper });
  let request;
  act(() => { request = result.current.register.createUser({ ...credentials, displayName: 'Autora' }); });
  expect(result.current.login.loading).toBe(true);
  await act(async () => { expect(await result.current.login.login(credentials)).toBeNull(); });
  expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  await act(async () => {
    finishCreation({ user: { uid: 'author-1' } });
    await request;
  });
  expect(result.current.login.loading).toBe(false);
  await act(async () => { await result.current.login.login(credentials); });
  expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
});
