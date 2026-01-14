// load-tests/scenarios/stress.test.js - Stress Test (High Load)
const LoadTester = require('../load-runner.cjs');

async function runStressTest() {
    const tester = new LoadTester({
        name: 'Stress Test (High Load)',
        vus: 50,            // 50 virtual users
        duration: 120000,   // 2 minutes
        endpoint: '/api/shipments',
        method: 'GET'
    });

    const result = await tester.run();

    // Assert performance targets (more relaxed for stress test)
    const { stats, successRate } = result;

    console.log('✅ Stress Test Targets:');
    console.log(`   Success Rate: ${successRate >= 95 ? '✓' : '✗'} ${successRate.toFixed(2)}% (target: 95%)`);
    console.log(`   Avg Response: ${stats.avg < 300 ? '✓' : '✗'} ${stats.avg.toFixed(2)}ms (target: <300ms)`);
    console.log(`   P95 Response: ${stats.p95 < 1000 ? '✓' : '✗'} ${stats.p95}ms (target: <1000ms)`);
    console.log(`   P99 Response: ${stats.p99 < 2000 ? '✓' : '✗'} ${stats.p99}ms (target: <2000ms)`);

    const passed = successRate >= 95 && stats.avg < 300 && stats.p95 < 1000 && stats.p99 < 2000;

    if (passed) {
        console.log('\n✅ STRESS TEST PASSED\n');
        process.exit(0);
    } else {
        console.log('\n❌ STRESS TEST FAILED\n');
        process.exit(1);
    }
}

runStressTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
