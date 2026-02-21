import { initializeOffering, executeJob, validateRequirements, metadata } from '../offerings/storage/handlers.js';

const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;

if (!EVM_PRIVATE_KEY) {
  console.error('Error: EVM_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

initializeOffering({ evmPrivateKey: EVM_PRIVATE_KEY });

console.log('CHRONICLE Storage Agent initialized');
console.log('Offering:', metadata.name, 'v' + metadata.version);

export { executeJob, validateRequirements, metadata };