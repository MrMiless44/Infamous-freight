// Quick load test for validation
const LoadTester = require('../load-runner.cjs');

async function runQuickTest() {
    const tester = new LoadTester({
        name: 'Quick Load Test',
        vus: 5,
        duration: 10000, // 10 seconds
        endpoint: '/api/shipments',
        method: 'GET'
    });

    const result = await tester.run();
    console.log(`\n✅ Quick test complete - ${result.successRate.toFixed(2)}% success rate\n`);
    process.exit(0);
}

runQuickTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
