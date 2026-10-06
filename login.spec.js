const { test } = require('@playwright/test');

test('login do usuario teste', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

  await page.goto('http://localhost:8000/index.html');
  await page.fill('#loginUsuario', 'usuario_teste');
  await page.fill('#loginSenha', 'Teste123');
  await page.locator('#formLogin button[type="submit"]').click();

  await page.waitForTimeout(3000);

  const appHidden = await page.locator('#telaApp').evaluate(el => el.hidden);
  const authHidden = await page.locator('#telaAuth').evaluate(el => el.hidden);
  const perfilNome = await page.locator('#perfilNome').textContent().catch(() => 'NO_PERFIL');
  const loginMsg = await page.locator('#loginMsg').textContent().catch(() => 'NO_MSG');

  console.log('APP_HIDDEN:', appHidden);
  console.log('AUTH_HIDDEN:', authHidden);
  console.log('PERFIL_NOME:', perfilNome);
  console.log('LOGIN_MSG:', loginMsg);
});
