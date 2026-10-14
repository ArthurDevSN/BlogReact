import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useFetchDocuments } from '../hooks/useFetchDocuments';
import { useFetchDocument } from '../hooks/useFetchDocument';
import Home from './Home/Home';
import Search from './Search/Search';
import Post from './Post/Post';
import PostDetail from '../components/PostDetail';

jest.mock('../hooks/useFetchDocuments');
jest.mock('../hooks/useFetchDocument');

beforeEach(() => {
  jest.clearAllMocks();
  useFetchDocuments.mockReturnValue({ documents: [], loading: false, error: null });
  useFetchDocument.mockReturnValue({ document: null, loading: false, error: null });
});

function SearchLocation() {
  const { search } = useLocation();
  return <p data-testid="query">{new URLSearchParams(search).get('q')}</p>;
}

test('home normalizes and encodes tags without turning special characters into parameters', () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchLocation />} />
      </Routes>
    </MemoryRouter>
  );
  const button = screen.getByRole('button', { name: 'Pesquisar' });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '  React & CSS#1  ' } });
  fireEvent.click(button);
  expect(screen.getByTestId('query')).toHaveTextContent('react & css#1');
});

test('home displays a fetch error without suggesting there are no posts', () => {
  useFetchDocuments.mockReturnValue({ documents: [], loading: false, error: 'Falha na conexão.' });
  render(<MemoryRouter><Home /></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent('Falha na conexão.');
  expect(screen.queryByText('Não foram encontrados posts.')).not.toBeInTheDocument();
});

test('search reports empty results for a normalized tag', () => {
  render(<MemoryRouter initialEntries={['/search?q=%20REACT%20']}><Search /></MemoryRouter>);
  expect(useFetchDocuments).toHaveBeenCalledWith('post', 'react');
  expect(screen.getByRole('status')).toHaveTextContent('Não foram encontrados posts para esta tag.');
});

test('search without a tag explains how to search and does not subscribe to all posts', () => {
  render(<MemoryRouter initialEntries={['/search?q=%20']}><Search /></MemoryRouter>);
  expect(useFetchDocuments).not.toHaveBeenCalled();
  expect(screen.getByText(/Informe uma tag/)).toBeInTheDocument();
});

test.each([['home', '/', Home], ['search', '/search?q=react', Search]])(
  '%s distinguishes an empty cache from a confirmed empty collection', (name, path, Page) => {
    useFetchDocuments.mockReturnValue({ documents: [], loading: false, error: null, fromCache: true });
    const { rerender } = render(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Aguardando confirmação dos posts.');
    expect(screen.queryByText(/Não foram encontrados posts/)).not.toBeInTheDocument();

    useFetchDocuments.mockReturnValue({ documents: [], loading: false, error: null, fromCache: false });
    rerender(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    expect(screen.getByText(/Não foram encontrados posts/)).toBeInTheDocument();
  }
);

test('search distinguishes loading and connection errors from empty results', () => {
  useFetchDocuments.mockReturnValue({ documents: [], loading: true, error: null });
  const { rerender } = render(<MemoryRouter initialEntries={['/search?q=react']}><Search /></MemoryRouter>);
  expect(screen.getByRole('status')).toHaveTextContent('Buscando posts...');
  expect(screen.queryByText(/Não foram encontrados/)).not.toBeInTheDocument();

  useFetchDocuments.mockReturnValue({ documents: [], loading: false, error: 'Sem conexão.' });
  rerender(<MemoryRouter initialEntries={['/search?q=react']}><Search /></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão.');
  expect(screen.queryByText(/Não foram encontrados/)).not.toBeInTheDocument();
});

test('post cards show the stored author and preserve special characters in tag links', () => {
  render(<MemoryRouter><PostDetail post={{ id: 'one', title: 'Título', createdBy: 'Ana', image: 'https://example.com/image.jpg', tagsArray: ['c#', 'c#'] }} /></MemoryRouter>);
  expect(screen.getByText('Por Ana')).toBeInTheDocument();
  const tagLink = screen.getByRole('link', { name: /#\s*c#/ });
  expect(tagLink).toHaveAttribute('href', '/search?q=c%23');
  expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
});

test('post details show not found only after loading finishes', () => {
  useFetchDocument.mockReturnValue({ document: null, loading: true, error: null });
  const { rerender } = render(<MemoryRouter><Post /></MemoryRouter>);
  expect(screen.getByRole('status')).toHaveTextContent('Carregando post...');
  expect(screen.queryByText('Post não encontrado')).not.toBeInTheDocument();

  useFetchDocument.mockReturnValue({ document: null, loading: false, error: null });
  rerender(<MemoryRouter><Post /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Post não encontrado' })).toBeInTheDocument();
});

test('post details report fetch errors and render legacy posts without tags', () => {
  useFetchDocument.mockReturnValue({ document: null, loading: false, error: 'Falha na leitura.' });
  const { rerender } = render(<MemoryRouter><Post /></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent('Falha na leitura.');
  expect(screen.queryByText('Post não encontrado')).not.toBeInTheDocument();

  useFetchDocument.mockReturnValue({ document: { title: 'Legado', body: 'Conteúdo', image: 'https://example.com/image.jpg' }, loading: false, error: null });
  rerender(<MemoryRouter><Post /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Legado' })).toBeInTheDocument();
  expect(screen.getByText('Por Autor')).toBeInTheDocument();
});
