//==========================================
// src/setupTests.ts
// ==========================================
import '@testing-library/jest-dom';
import * as React from 'react';

// Mock para ícones do react-icons
jest.mock('react-icons/fa', () => ({
  FaWarehouse: () => React.createElement('span', { 'data-test': 'icon-warehouse' }, 'Icon'),
  FaCheck: () => React.createElement('span', { 'data-test': 'icon-check' }, 'Icon'),
  FaExchangeAlt: () => React.createElement('span', { 'data-testid': 'icon-exchange' }, 'Icon'),
  FaBoxOpen: () => React.createElement('span', { 'data-testid': 'icon-box' }, 'Icon'),
}));

// Mock para console.error (opcional - ajuda a limpar output dos testes)
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// ==========================================
// package.json (adicionar estas dependências)
// ==========================================
/*
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.5",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1",
    "identity-obj-proxy": "^3.0.0"
  }
}
*/