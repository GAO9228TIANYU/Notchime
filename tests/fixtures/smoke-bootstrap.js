// Test-local Node preload. Production Main contains no environment-based provider switch.
if (process.versions.electron && !process.env.ELECTRON_RUN_AS_NODE) {
  require('./install-calendar');
  process.stderr.write('AUDIT_FIXTURE_INSTALLED\n');
}
