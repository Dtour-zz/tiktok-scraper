import { createRequire } from 'module';

/**
 * Backwards compatible TypeScript wrapper that delegates to the runnable JavaScript build.
 * Run `node examples/getFollowers.js` for the native Node.js experience.
 */
const requireForScript = createRequire(__filename);
requireForScript('./getFollowers.js');
