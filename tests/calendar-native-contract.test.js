const test = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('Swift Helper keeps Calendar read-only authorization with a macOS 13 fallback', () => {
  const source = fs.readFileSync(path.join(root, 'native/calendar-helper/main.swift'), 'utf8');
  assert.match(source, /#available\(macOS 14\.0, \*\).*requestFullAccessToEvents/);
  assert.match(source, /requestAccess\(to: \.event/);
  assert.doesNotMatch(source, /requestWriteOnly|save\(.*event|remove\(.*event|import Contacts|osascript/);
  assert.equal([...source.matchAll(/forName: \.EKEventStoreChanged/g)].length, 1);
  assert.match(source, /predicateForEvents\(withStart: start, end: end, calendars: selected\)/);
  assert.match(source, /if !selected\.isEmpty/);
  assert.match(source, /NSSystemTimeZoneDidChange/);
  assert.match(source, /NSSystemClockDidChange/);
  assert.match(source, /NSCalendarDayChanged/);
});
test('main and native bundles declare correct usage strings, IDs, fixed resources and minimum OS', () => {
  const config = require('../package.json');
  const plist = fs.readFileSync(path.join(root, 'native/calendar-helper/Info.plist'), 'utf8');
  for (const key of ['NSCalendarsUsageDescription','NSCalendarsFullAccessUsageDescription','NSRemindersUsageDescription','NSRemindersFullAccessUsageDescription']) {
    assert.match(plist, new RegExp(`<key>${key}</key>`)); assert.equal(typeof config.build.mac.extendInfo[key], 'string');
  }
  assert.doesNotMatch(plist, /NSMicrophone|NSCamera|NSContacts|NSAppleEvents/);
  assert.match(plist, /com.calendarnotch.dev.calendar-helper/);
  assert.match(plist, /<key>LSMinimumSystemVersion<\/key><string>13.0<\/string>/);
  assert.deepEqual(config.build.extraResources, [
    { from: '.cache/native/CalendarNotchCalendarHelper.app', to: 'native/CalendarNotchCalendarHelper.app' },
    { from: 'node_modules/electron/dist/LICENSE', to: 'licenses/electron/LICENSE' },
    { from: 'node_modules/electron/dist/LICENSES.chromium.html', to: 'licenses/electron/LICENSES.chromium.html' },
  ]);
  assert.equal(config.scripts.prestart, 'node scripts/build-calendar-helper.js');
});
