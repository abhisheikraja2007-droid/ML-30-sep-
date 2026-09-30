import { MOCK_VALIDATION_CHECKS } from '../data/mockValidation';

export const validationService = {
  getValidationStatus: async () => {
    await new Promise(res => setTimeout(res, 500));
    const allPassed = MOCK_VALIDATION_CHECKS.every(c => c.status === 'PASS');
    return {
      overallStatus: allPassed ? 'PASS' : 'ISSUES_FOUND',
      timestamp: new Date().toISOString(),
      checks: MOCK_VALIDATION_CHECKS,
      totalChecks: MOCK_VALIDATION_CHECKS.length,
      passedCount: MOCK_VALIDATION_CHECKS.filter(c => c.status === 'PASS').length,
      failedCount: MOCK_VALIDATION_CHECKS.filter(c => c.status === 'FAIL').length
    };
  }
};
