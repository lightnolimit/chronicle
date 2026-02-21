import { UploadImageHandler } from '../../src/handlers/upload_image.js';
import { UploadMarkdownHandler } from '../../src/handlers/upload_markdown.js';
import { UploadJsonHandler } from '../../src/handlers/upload_json.js';
let imageHandler = null;
let markdownHandler = null;
let jsonHandler = null;
export function initializeOffering(config) {
    imageHandler = new UploadImageHandler(config.evmPrivateKey);
    markdownHandler = new UploadMarkdownHandler(config.evmPrivateKey);
    jsonHandler = new UploadJsonHandler(config.evmPrivateKey);
}
export async function executeJob(requirements) {
    if (!imageHandler || !markdownHandler || !jsonHandler) {
        throw new Error('Offering not initialized. Call initializeOffering first.');
    }
    const { data, type, encrypted, cipherIv } = requirements;
    let result;
    switch (type) {
        case 'image':
            result = await imageHandler.handle(data, encrypted, cipherIv);
            break;
        case 'markdown':
            result = await markdownHandler.handle(data, encrypted, cipherIv);
            break;
        case 'json':
            result = await jsonHandler.handle(data, encrypted, cipherIv);
            break;
        default:
            throw new Error(`Unknown upload type: ${type}`);
    }
    return result;
}
export function validateRequirements(requirements) {
    if (!requirements || typeof requirements !== 'object') {
        return false;
    }
    const req = requirements;
    if (typeof req.data !== 'string') {
        throw new Error('Missing or invalid required field: data (string)');
    }
    if (!['image', 'markdown', 'json'].includes(req.type)) {
        throw new Error('Missing or invalid required field: type (must be image, markdown, or json)');
    }
    if (req.encrypted === true && !req.cipherIv) {
        throw new Error('cipherIv is required when encrypted is true');
    }
    return true;
}
export const metadata = {
    name: 'chronicle-storage',
    description: 'Persistent storage service for AI agents',
    version: '1.0.0',
};
