#!/usr/bin/env bash
# Roda os testes do Seu Comando: regras do banco (PGlite) e telas do app (Playwright).
# Uso: cd tests && npm install && npx playwright install chromium && bash rodar.sh
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"; RAIZ="$(dirname "$AQUI")"
SITE="$(mktemp -d)"; mkdir -p "$SITE/saida"
# Cópia do site sem o banco de verdade: com supabaseUrl vazio, o app roda só com o exemplo local.
tar -C "$RAIZ" --exclude=.git --exclude=tests --exclude=node_modules -cf - . | tar -C "$SITE" -xf -
sed -i "s|supabaseUrl: '[^']*'|supabaseUrl: ''|" "$SITE/assets/js/config.js"
python3 -m http.server 8765 --bind 127.0.0.1 --directory "$SITE" >/dev/null 2>&1 & SRV=$!
trap 'kill $SRV 2>/dev/null; rm -rf "$SITE"' EXIT
sleep 1
falhas=0
if node "$AQUI/sql/banco.test.mjs" > "$SITE/saida/banco.log" 2>&1; then echo "ok     banco (regras do Supabase)"; else echo "FALHOU banco"; tail -20 "$SITE/saida/banco.log"; falhas=1; fi
for t in "$AQUI"/e2e/*-test.js; do
  n=$(basename "$t"); out=$(node "$t" "$SITE/saida" 2>&1); rc=$?
  if [ $rc -ne 0 ] || echo "$out" | grep -E "^(> )?ERROS" | grep -vqE "nenhum|ERROS \(0\)"; then echo "FALHOU $n"; echo "$out" | tail -15; falhas=1; else echo "ok     $n"; fi
done
exit $falhas
