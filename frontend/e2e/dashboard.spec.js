import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Automation', () => {

  test('Deve bloquear acesso sem login e redirecionar para Login', async ({ page }) => {
    // Tenta acessar dashboard diretamente
    await page.goto('/dashboard');
    // Deve ser redirecionado
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Acessar Sistema')).toBeVisible();
  });

  test('Deve realizar login com sucesso', async ({ page }) => {
    await page.goto('/');
    
    // Preenche credenciais
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    
    // Clica no botão de acesso
    await page.click('button:has-text("Acessar Sistema")');
    
    // Verifica redirecionamento e carregamento
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=PAINEL DE FECHAMENTO')).toBeVisible();
  });

  test('Deve exibir erro de login com credenciais incorretas', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="text"]', 'hacker');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button:has-text("Acessar Sistema")');
    
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
  });

});
