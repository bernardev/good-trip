// scripts/test-emissao-bilhete.js
// Execute com: node scripts/test-emissao-bilhete.js

import fs from 'fs';
import path from 'path';

console.log('🧪 TESTE DE EMISSÃO DE BILHETE - SEM PAGAMENTO REAL\n');

// 1️⃣ Simular dados de uma reserva
const orderId = `test_${Date.now()}`;
const reservaData = {
  servico: "101431",  // ← TROQUE pelo número do serviço que aparece nos resultados
  origem: "12722",
  destino: "18697",
  data: "2025-12-15",
  assentos: ["12"],
  passageiro: {
    nome: "Eduardo",
    sobrenome: "Teste",
    documento: "10390289930",
    email: "ehbernardes09@gmail.com"
  },
  preco: 118.99,
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
console.log('   - Chamar VIOP para bloquear a poltrona');
console.log('   - Chamar VIOP para confirmar venda');
console.log('   - Exibir o LOCALIZADOR do bilhete!\n');
console.log('⚠️  ATENÇÃO: Isso VAI EMITIR UM BILHETE REAL na VIOP!');
console.log('   Se quiser apenas testar sem emitir, comente as chamadas fetch() no arquivo:');
console.log('   apps/web/src/app/api/viop/confirmar-reserva/route.ts\n');
console.log('Order ID criado:', orderId);