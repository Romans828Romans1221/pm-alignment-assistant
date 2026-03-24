const { buildPrompt } = require('../src/services/aiService');

describe('buildPrompt', () => {

  test('includes leader goal in prompt', () => {
    const prompt = buildPrompt(
      'Ship MVP by end of quarter',
      'Focus on core features only',
      'Joshua',
      'Engineer',
      'We need to deliver the core product'
    );
    expect(prompt).toContain('Ship MVP by end of quarter');
  });

  test('includes member understanding in prompt', () => {
    const prompt = buildPrompt(
      'Ship MVP by end of quarter',
      '',
      'Joshua',
      'Engineer',
      'We need to deliver the core product'
    );
    expect(prompt).toContain('We need to deliver the core product');
  });

  test('includes member name and role in prompt', () => {
    const prompt = buildPrompt(
      'Ship MVP by end of quarter',
      '',
      'Joshua',
      'Engineer',
      'We need to deliver the core product'
    );
    expect(prompt).toContain('Joshua');
    expect(prompt).toContain('Engineer');
  });

  test('requests JSON response format', () => {
    const prompt = buildPrompt(
      'Ship MVP by end of quarter',
      '',
      'Joshua',
      'Engineer',
      'We need to deliver the core product'
    );
    expect(prompt).toContain('JSON');
  });

  test('includes context when provided', () => {
    const prompt = buildPrompt(
      'Ship MVP by end of quarter',
      'Focus on mobile first',
      'Joshua',
      'Engineer',
      'We need to deliver the core product'
    );
    expect(prompt).toContain('Focus on mobile first');
  });

});