// @ts-nocheck
/// <reference types="vitest" />
import { apiClient } from './api';

// Very small unit test: ensure apiClient exists and has request method
describe('ApiClient basic', () => {
  it('has request method', () => {
    expect(typeof apiClient.request).toBe('function');
  });
});
