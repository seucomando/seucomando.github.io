# Testes

Rodam sozinhos no GitHub a cada envio (aba Actions) e também no computador:

```
cd tests
npm install
npx playwright install chromium
bash rodar.sh
```

- `sql/banco.test.mjs`: aplica `supabase/schema*.sql` num Postgres de teste (PGlite) e confere as regras do banco: ponto, ajustes, documentos, holerites, rostos e checklists. Um caso marcado "(esperado erro)" precisa ser recusado pelo banco; os outros precisam passar.
- `e2e/*-test.js`: abrem o app num navegador (Playwright) com o exemplo local e percorrem as telas como empresa, contador, gerente e funcionário. `nuvem-test.js` usa um banco falso (`fake-supabase.js`), sem tocar no Supabase de verdade.
