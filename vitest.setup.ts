import '@testing-library/jest-dom';
import { vi } from 'vitest';

const IntersectionObserverMock = class {
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn();
  unobserve = vi.fn();
};

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
