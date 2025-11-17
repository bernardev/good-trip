/**
 * Script de teste rápido do DistribusionReverseAdapter
 * Execute: npx tsx test-distribusion.ts
 */

import { DistribusionReverseAdapter } from './src/services/distribusion-reverse-adapter';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color: string, message: string): void {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAdapter(): Promise<void> {
  log(colors.blue, '\n🧪 Testando DistribusionReverseAdapter...\n');
  
  const adapter = new DistribusionReverseAdapter('814999');

  try {
    log(colors.yellow, '📍 Teste 1: Buscando cidades...\n');
    const cities = await adapter.getCities();
    
    if (cities.length > 0) {
      log(colors.green, `✓ ${cities.length} cidades encontradas`);
      console.log('  Exemplos:', cities.slice(0, 3).map(c => c.name).join(', '));
    } else {
      log(colors.red, '✗ Nenhuma cidade encontrada');
    }

    log(colors.yellow, '\n📍 Teste 2: Buscando viagens Curitiba → São Paulo...\n');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const trips = await adapter.searchTrips({
      departureCity: 'BRXDM',
      arrivalCity: 'BRSAO',
      departureDate: dateStr,
      passengers: 1,
    });

    if (trips.length > 0) {
      log(colors.green, `✓ ${trips.length} viagens encontradas\n`);
      console.log('🚌 Primeira viagem:');
      const first = trips[0];
      console.log(`   Empresa: ${first.carrier}`);
      console.log(`   Preço: R$ ${first.price.toFixed(2)}`);
      console.log(`   Horário: ${first.departureTime}`);
      console.log(`   Link: ${first.bookingUrl}`);
      
      if (first.amenities && first.amenities.length > 0) {
        console.log(`   Comodidades: ${first.amenities.join(', ')}`);
      }
    } else {
      log(colors.yellow, '⚠ Nenhuma viagem encontrada');
    }

    log(colors.green, '\n✓ Distribusion API funcionando!\n');
    log(colors.blue, '🎉 Testes concluídos com sucesso!\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    log(colors.red, `\n✗ Erro nos testes: ${errorMessage}`);
    console.error(error);
    process.exit(1);
  }
}

testAdapter().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  log(colors.red, `\nErro fatal: ${errorMessage}`);
  process.exit(1);
});