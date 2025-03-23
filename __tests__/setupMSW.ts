import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetTodos } from './mocks/handlers';

export const server = setupServer(...handlers);

const runningE2E = process.env.E2E_TEST === 'true';

if (!runningE2E) {
  const mockServer = setupServer(...handlers);

  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    mockServer.close();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    resetTodos();
  });
}
