/** Mensagem exibida em Alert a partir do erro vindo da API / json-server. */
export function authFlowErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Algo deu errado. Tente novamente.';
}
