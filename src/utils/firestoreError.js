const messages = {
  'permission-denied': 'Você não tem permissão para realizar esta ação.',
  unauthenticated: 'Entre na sua conta para continuar.',
  unavailable: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
  'deadline-exceeded': 'A operação demorou mais que o esperado. Tente novamente.',
  'not-found': 'O post não foi encontrado. Ele pode ter sido removido.',
  'failed-precondition': 'Não foi possível concluir esta ação. Tente novamente mais tarde.',
  'resource-exhausted': 'O serviço está temporariamente indisponível. Tente novamente mais tarde.',
};

export const firestoreError = (error, fallback) =>
  error?.code ? messages[error.code] || fallback : error?.message || fallback;
