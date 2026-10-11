// Dependency replacement exists exclusively in tests, never in production Main.
const path = require('node:path');
const { spawn } = require('node:child_process');
const modulePath = require.resolve('../../calendar-bridge');
const original = require(modulePath);
class FixtureBridge extends original.CalendarBridge {
  constructor(executable) {
    // Use the test runner's actual Node executable. Launching an Electron bundle
    // again in RUN_AS_NODE mode interferes with macOS application focus identity.
    if (!process.env.CALENDAR_TEST_NODE) throw new Error('Fixture Node runtime missing; run via npm test');
    super(executable, { spawnProcess: (_path, _args, options) => spawn(process.env.CALENDAR_TEST_NODE,
      [path.join(__dirname, 'calendar-helper.js')], { ...options, env: { ...process.env } }) });
    global.__calendarFixtureBridge = this;
  }
}
require.cache[modulePath].exports = { ...original, CalendarBridge: FixtureBridge };
