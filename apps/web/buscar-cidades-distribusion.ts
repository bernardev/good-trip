const ALFABETO = 'abcdefghijklmnopqrstuvwxyz'.split('');

async function buscarTodasCidades() {
  const cidades = new Set<string>();
  
  for (const letra of ALFABETO) {
    console.log(`🔍 Buscando cidades com: ${letra}...`);
    
    const url = `https://global-api.distribusion.com/locations?q=${letra}&rpn=814999&locale=pt&locationTypes[]=city&limitTopLevel=50`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      for (const location of data) {
        if (location.type === 'city' && location.countryCode === 'BR') {
          const cidade = {
            code: location.code,
            name: location.names?.[0] || location.bestMatch?.replace(/<[^>]*>/g, '')
          };
          cidades.add(JSON.stringify(cidade));
        }
      }
      
      console.log(`   ✅ ${data.length} resultados`);
      await sleep(500); // Delay para não sobrecarregar
    } catch (error) {
      console.error(`   ❌ Erro: ${error}`);
    }
  }
  
  // Converter para array e ordenar
  const cidadesArray = Array.from(cidades)
    .map(str => JSON.parse(str))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Gerar código TypeScript
  console.log('\n📋 RESULTADO (copie e cole no código):\n');
  console.log('const CIDADES_BR = [');
  cidadesArray.forEach(c => {
    console.log(`  { code: '${c.code}', name: '${c.name}' },`);
  });
  console.log('];');
  
  console.log(`\n✅ Total: ${cidadesArray.length} cidades encontradas!`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

buscarTodasCidades();