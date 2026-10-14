export const normalizeTags = (tags) =>
  [...new Set(
    (typeof tags === 'string' ? tags : '')
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  )];

export const isHttpUrl = (value) => {
  try {
    if (!/^https?:\/\//.test(value)) return false;
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validatePost = ({ title, image, body, tags }) => {
  const data = {
    title: title.trim(),
    image: image.trim(),
    body: body.trim(),
    tagsArray: normalizeTags(tags),
  };

  if (!data.title || !data.image || !data.body || !data.tagsArray.length) {
    return { data: null, error: 'Por favor, preencha todos os campos e informe ao menos uma tag.' };
  }

  if (data.title.length > 200 || data.body.length > 50000) {
    return { data: null, error: 'Use até 200 caracteres no título e até 50.000 no conteúdo.' };
  }

  if (!isHttpUrl(data.image) || data.image.length > 2048) {
    return { data: null, error: 'A imagem precisa ser uma URL válida com http:// ou https://, de até 2.048 caracteres.' };
  }

  if (data.tagsArray.length > 20) {
    return { data: null, error: 'Informe no máximo 20 tags por post.' };
  }

  if (data.tagsArray.some((tag) => tag.length > 50)) {
    return { data: null, error: 'Cada tag deve ter no máximo 50 caracteres.' };
  }

  return { data, error: null };
};
