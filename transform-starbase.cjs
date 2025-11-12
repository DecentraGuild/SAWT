const fs = require('fs');

// Read the original backup file
const data = JSON.parse(fs.readFileSync('./public/starbase-cargos.json.backup', 'utf8'));

// Get all unique starbases (columns) and sort them
const starbases = [...new Set(data.map(d => d.starbase_address))].sort();

// Get all unique resources (rows) and their metadata
const resourceMap = new Map();
data.forEach(entry => {
  const key = entry.mint;
  if (!resourceMap.has(key)) {
    resourceMap.set(key, {
      mint: entry.mint,
      name: entry.name,
      symbol: entry.symbol,
      program_id: entry.program_id
    });
  }
  resourceMap.get(key)[entry.starbase_address] = entry.cargoMint;
});

// Create the table structure:
// - starbases: array of starbase addresses (column headers)
// - resources: array of resource objects with cargoMints array aligned to starbases
const result = {
  starbases: starbases,
  resources: Array.from(resourceMap.values()).map(r => ({
    mint: r.mint,
    name: r.name,
    symbol: r.symbol,
    program_id: r.program_id,
    cargoMints: starbases.map(sb => r[sb] || null) // Array aligned with starbases array
  }))
};

// Write the new structure
fs.writeFileSync('./public/starbase-cargos.json', JSON.stringify(result, null, 2));

console.log('Created table structure:');
console.log('- Starbases (columns):', starbases.length);
console.log('- Resources (rows):', result.resources.length);
console.log('\nStructure:');
console.log('- Column 1: Resource mints (in resources array)');
console.log('- Row 1: Starbase addresses (in starbases array)');
console.log('- Matrix: cargoMints array in each resource, aligned with starbases array');

