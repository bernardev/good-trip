// scripts/test-emissao-bilhete.js
// Execute com: node scripts/test-emissao-bilhete.js

import fs from 'fs';
import path from 'path';

console.log('🧪 TESTE DE EMISSÃO DE BILHETE - MODO TESTE\n');

// 1️⃣ Simular dados de uma reserva
const orderId = `test_${Date.now()}`;
const reservaData = {
  servico: "1110",
  origem: "10102",
  destino: "21757",
  data: "2025-12-27",
  assentos: ["44"],
  passageiro: {
    nome: "Jucelino",
    sobrenome: "Alves",
    documento: "79469426215",
    email: "jucelino@goodtrip-itb.com"
  },
  preco: 39.50,
};

console.log('📦 Dados da reserva:');
console.log(JSON.stringify(reservaData, null, 2));
console.log('');

// 2️⃣ Salvar arquivo JSON (simula o que o Pagar.me faz)
const dir = path.join(process.cwd(), '.cache', 'reservas');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const filepath = path.join(dir, `${orderId}.json`);
fs.writeFileSync(filepath, JSON.stringify(reservaData, null, 2));

console.log('✅ Arquivo salvo em:', filepath);
console.log('');

// 3️⃣ Gerar URL de teste
const testUrl = `http://localhost:3000/buscar-viop/confirmacao?order_id=${orderId}&status=paid`;

console.log('🎯 PRÓXIMOS PASSOS:\n');
console.log('1. Certifique-se que o servidor Next.js está rodando (npm run dev)');
console.log('2. Abra esta URL no navegador:\n');
console.log(`   ${testUrl}\n`);
console.log('3. A página vai:');
console.log('   - Ler o arquivo JSON salvo');
console.log('   - Como MODO_TESTE = true, vai retornar dados mockados');
console.log('   - Exibir o bilhete com layout completo!');
console.log('   - NÃO vai chamar a VIOP de verdade\n');
console.log('⚠️  ATENÇÃO:');
console.log('   - MODO_TESTE = true: Usa dados mockados (sem chamar VIOP)');
console.log('   - MODO_TESTE = false: Vai emitir bilhete REAL na VIOP!\n');
console.log('📋 Para verificar o MODO_TESTE, veja:');
console.log('   apps/web/src/app/api/viop/confirmar-reserva/route.ts\n');
console.log('Order ID criado:', orderId);
console.log('');
console.log('🎉 Pronto para testar o layout da página de confirmação!');