import { Page } from '@playwright/test';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function loginAsTestUser(page: Page): Promise<void> {
  // Get test token from backend
  const response = await page.request.post(`${API_BASE_URL}/auth/test-login`);

  if (!response.ok()) {
    throw new Error(`Failed to get test token: ${response.status()}`);
  }

  const { token } = await response.json();

  // Store token in localStorage before navigating
  await page.addInitScript((authToken: string) => {
    localStorage.setItem('auth_token', authToken);
  }, token);
}
