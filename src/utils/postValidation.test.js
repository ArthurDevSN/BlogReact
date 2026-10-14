import { isHttpUrl, normalizeTags, validatePost } from './postValidation';

const validPost = {
  title: ' Meu post ',
  image: ' https://example.com/image.jpg ',
  body: ' Conteúdo do post ',
  tags: ' React, , JAVASCRIPT, react, JavaScript ',
};

test('normaliza tags, remove duplicatas e ignora entradas vazias', () => {
  expect(normalizeTags(validPost.tags)).toEqual(['react', 'javascript']);
  expect(normalizeTags(', ,')).toEqual([]);
});

test('retorna conteúdo sem espaços nas extremidades e tags normalizadas', () => {
  expect(validatePost(validPost)).toEqual({
    data: {
      title: 'Meu post', image: 'https://example.com/image.jpg',
      body: 'Conteúdo do post', tagsArray: ['react', 'javascript'],
    },
    error: null,
  });
});

// eslint-disable-next-line no-script-url -- URL insegura intencional para testar rejeição pelo validador.
test.each(['javascript:alert(1)', 'data:image/png;base64,a', 'ftp://example.com/image.jpg', 'https:example.com', 'não é url'])(
  'rejeita imagem sem URL HTTP(S) completa: %s', (image) => {
    expect(isHttpUrl(image)).toBe(false);
    expect(validatePost({ ...validPost, image }).error).toMatch(/URL válida/);
  }
);

test.each(['title', 'image', 'body', 'tags'])('rejeita campo %s contendo apenas espaços', (field) => {
  expect(validatePost({ ...validPost, [field]: '   ' }).error).toMatch(/preencha todos/);
});

test('exige ao menos uma tag com conteúdo', () => {
  expect(validatePost({ ...validPost, tags: ', , ,' }).error).toMatch(/ao menos uma tag/);
});

test('valida limites do título, conteúdo, URL e quantidade de tags', () => {
  expect(validatePost({ ...validPost, title: 'x'.repeat(201) }).error).toBeTruthy();
  expect(validatePost({ ...validPost, body: 'x'.repeat(50001) }).error).toBeTruthy();
  expect(validatePost({ ...validPost, image: `https://example.com/${'a'.repeat(2048)}` }).error).toBeTruthy();
  expect(validatePost({ ...validPost, tags: Array.from({ length: 21 }, (_, index) => `tag${index}`).join(',') }).error)
    .toMatch(/máximo 20/);
  expect(validatePost({ ...validPost, tags: 'a'.repeat(51) }).error).toMatch(/máximo 50/);
});
