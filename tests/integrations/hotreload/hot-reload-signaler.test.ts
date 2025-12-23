import { describe, it, expect } from 'vitest';
import { HotReloadSignaler } from '../../src/integrations/hotreload/hot-reload-signaler';

describe('HotReloadSignaler', () => {
  it('should create HotReloadSignaler instance', () => {
    const signaler = new HotReloadSignaler();
    expect(signaler).toBeDefined();
  });

  it('should detect Claude process or return null', async () => {
    const signaler = new HotReloadSignaler();
    const process = await signaler.detectClaudeProcess();
    expect(process).toBeDefined();
    expect(process).toBeInstanceOf(Object);
  });
});
