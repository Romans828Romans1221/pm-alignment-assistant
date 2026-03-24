const { checkAndRecordUsage } = require('../src/services/teamService');

describe('checkAndRecordUsage', () => {

  test('master key bypasses all usage limits', async () => {
    process.env.MASTER_KEY = 'ClarityAdmin2026';

    const mockDb = {};
    const result = await checkAndRecordUsage(
      mockDb,
      'ClarityAdmin2026',
      null
    );

    expect(result.isMasterKey).toBe(true);
  });

  test('throws PaymentRequiredError when device limit reached', async () => {
    process.env.MASTER_KEY = 'ClarityAdmin2026';

    const mockDb = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              totalFreeChecks: 15,
              isDevDevice: false
            })
          }),
          set: async () => {}
        })
      })
    };

    await expect(
      checkAndRecordUsage(mockDb, 'some-team-code', 'some-device-id')
    ).rejects.toThrow('This device has reached the maximum free checks.');
  });

  test('throws PaymentRequiredError when team limit reached', async () => {
    process.env.MASTER_KEY = 'ClarityAdmin2026';

    const mockDb = {
      collection: (name) => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              count: 30,
              isPro: false
            })
          }),
          set: async () => {}
        })
      })
    };

    await expect(
      checkAndRecordUsage(mockDb, 'some-team-code', null)
    ).rejects.toThrow('This team has used its 30 free checks');
  });

  test('pro team is never blocked', async () => {
    process.env.MASTER_KEY = 'ClarityAdmin2026';

    const mockDb = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              count: 999,
              isPro: true
            })
          }),
          set: async () => {}
        })
      })
    };

    const result = await checkAndRecordUsage(
      mockDb,
      'pro-team-code',
      null
    );

    expect(result.isMasterKey).toBe(false);
  });

});