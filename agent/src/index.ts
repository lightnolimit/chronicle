import { initializeOffering, executeJob, validateRequirements, metadata } from '../offerings/storage/handlers.js';

const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;

if (!EVM_PRIVATE_KEY) {
  console.warn('Warning: EVM_PRIVATE_KEY not set. Agent will run in limited mode.');
  console.warn('Set EVM_PRIVATE_KEY in .env to enable full functionality.');
} else {
  initializeOffering({ evmPrivateKey: EVM_PRIVATE_KEY });
  console.log('CHRONICLE Storage Agent initialized');
  console.log('Offering:', metadata.name, 'v' + metadata.version);
}

console.log('CHRONICLE Agent ready');

export { executeJob, validateRequirements, metadata };