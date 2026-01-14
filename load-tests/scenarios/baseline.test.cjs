// load-tests/scenarios/baseline.test.js - Baseline Load Test
const LoadTester = require('../load-runner.cjs');

async function runBaselineTest() {
    const tester = new LoadTester({
        name: 'Baseline Test (Light Load)',
        vus: 10,           // 10 virtual users
        duration: 60000,   // 1 minute
        endpoint: '/api/shipments',
        method: 'GET'
    });

    const result = await tester.run();

    // Assert performance targets
    const { stats, successRate } = result;

    console.log('✅ Performance Targets:');
    console.log(`   Success Rate: ${successRate >= 99 ? '✓' : '✗'} ${successRate.toFixed(2)}% (target: 99%)`);
    console.log(`   Avg Response: ${stats.avg < 100 ? '✓' : '✗'} ${stats.avg.toFixed(2)}ms (target: <100ms)`);
    console.log(`   P95 Response: ${stats.p95 < 200 ? '✓' : '✗'} ${stats.p95}ms (target: <200ms)`);
    console.log(`   P99 Response: ${stats.p99 < 500 ? '✓' : '✗'} ${stats.p99}ms (target: <500ms)`);

    const passed = successRate >= 99 && stats.avg < 100 && stats.p95 < 200 && stats.p99 < 500;

    if (passed) {
        console.log('\n✅ BASELINE TEST PASSED\n');
        process.exit(0);
    } else {
        console.log('\n❌ BASELINE TEST FAILED\n');
        process.exit(1);
    }
}

runBaselineTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
