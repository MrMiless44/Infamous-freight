// load-tests/scenarios/spike.test.js - Spike Test (Sudden Traffic Surge)
const LoadTester = require('../load-runner.cjs');

async function runSpikeTest() {
    const tester = new LoadTester({
        name: 'Spike Test (Traffic Surge)',
        vus: 100,          // 100 virtual users (sudden spike)
        duration: 30000,   // 30 seconds
        endpoint: '/api/shipments',
        method: 'GET'
    });

    const result = await tester.run();

    // Assert performance targets (most relaxed for spike test)
    const { stats, successRate } = result;

    console.log('✅ Spike Test Targets:');
    console.log(`   Success Rate: ${successRate >= 90 ? '✓' : '✗'} ${successRate.toFixed(2)}% (target: 90%)`);
    console.log(`   Avg Response: ${stats.avg < 500 ? '✓' : '✗'} ${stats.avg.toFixed(2)}ms (target: <500ms)`);
    console.log(`   P95 Response: ${stats.p95 < 2000 ? '✓' : '✗'} ${stats.p95}ms (target: <2000ms)`);
    console.log(`   P99 Response: ${stats.p99 < 5000 ? '✓' : '✗'} ${stats.p99}ms (target: <5000ms)`);

    const passed = successRate >= 90 && stats.avg < 500 && stats.p95 < 2000 && stats.p99 < 5000;

    if (passed) {
        console.log('\n✅ SPIKE TEST PASSED\n');
        process.exit(0);
    } else {
        console.log('\n❌ SPIKE TEST FAILED\n');
        process.exit(1);
    }
}

runSpikeTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
