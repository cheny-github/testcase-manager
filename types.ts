export enum TestStatus {
  DRAFT = 'DRAFT',
  PASSING = 'PASSING',
  FAILING = 'FAILING',
  SKIPPED = 'SKIPPED'
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  input: string; // Stored as stringified JSON or raw text
  expectedOutput: string; // Stored as stringified JSON or raw text
  status: TestStatus;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type NewTestCase = Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>;

export interface ImportResult {
  success: boolean;
  count: number;
  errors: string[];
}