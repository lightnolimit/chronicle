import type { JobRequirements, JobResult } from '../../src/types/index.js';
export interface OfferingConfig {
    evmPrivateKey: string;
}
export declare function initializeOffering(config: OfferingConfig): void;
export declare function executeJob(requirements: JobRequirements): Promise<JobResult>;
export declare function validateRequirements(requirements: unknown): requirements is JobRequirements;
export declare const metadata: {
    name: string;
    description: string;
    version: string;
};
