/**
 * 压力测试脚本 - 模拟25人同时进入系统评估
 * 测试系统的响应时间和并发处理能力
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const CONCURRENT_USERS = 25;
const TEST_ROUNDS = 3; // 每个测试重复3次取平均值

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// 测试结果收集
const results = {
  companies: [],
  positions: [],
  evaluations: [],
  batchSave: [],
  rankings: []
};

// HTTP 请求封装
function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          duration: endTime - startTime,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      resolve({
        statusCode: 0,
        duration: endTime - startTime,
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      resolve({
        statusCode: 0,
        duration: 30000,
        error: 'Timeout',
        success: false
      });
    });
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// 测试1: 获取公司列表
async function testGetCompanies(userId) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/companies',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const result = await httpRequest(options);
  return { userId, ...result };
}

// 测试2: 获取岗位列表
async function testGetPositions(userId, companyId) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/positions?companyId=${companyId}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const result = await httpRequest(options);
  return { userId, ...result };
}

// 测试3: 获取评估数据
async function testGetEvaluations(userId, positionId) {
  const evaluatorName = encodeURIComponent(`测试用户${userId}`);
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/evaluations?positionId=${positionId}&evaluatorName=${evaluatorName}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const result = await httpRequest(options);
  return { userId, ...result };
}

// 测试4: 批量保存评分
async function testBatchSave(userId, positionId) {
  const body = JSON.stringify({
    evaluatorName: `压力测试用户${userId}`,
    scores: {
      [positionId]: {
        impactRange: Math.floor(Math.random() * 5) + 1,
        impactLevel: Math.floor(Math.random() * 5) + 1,
        problemComplexity: Math.floor(Math.random() * 5) + 1,
        problemSolving: Math.floor(Math.random() * 4) + 1,
        leadershipRange: Math.floor(Math.random() * 5) + 1,
        leadershipStyle: Math.floor(Math.random() * 5) + 1,
        internalCommunication: Math.floor(Math.random() * 5) + 1,
        externalCommunication: Math.floor(Math.random() * 4) + 1,
        knowledgeScope: Math.floor(Math.random() * 5) + 1,
        knowledgeLevel: Math.floor(Math.random() * 4) + 1,
        environmentComfort: Math.floor(Math.random() * 4) + 1,
        workBalance: Math.floor(Math.random() * 5) + 1,
        workTime: Math.floor(Math.random() * 5) + 1,
        replaceability: Math.floor(Math.random() * 4) + 1
      }
    }
  });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/evaluations/batch',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  
  const result = await httpRequest(options, body);
  return { userId, ...result };
}

// 测试5: 获取排名
async function testGetRankings(userId) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/rankings',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const result = await httpRequest(options);
  return { userId, ...result };
}

// 并发执行测试
async function runConcurrentTest(testName, testFn, userCount) {
  console.log(`\n${colors.cyan}=== 测试: ${testName} (${userCount}人并发) ===${colors.reset}`);
  
  const startTime = Date.now();
  
  // 创建所有用户的测试Promise
  const promises = [];
  for (let i = 1; i <= userCount; i++) {
    promises.push(testFn(i));
  }
  
  // 并发执行
  const results = await Promise.all(promises);
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // 统计结果
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const durations = results.map(r => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const p50 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.5)];
  const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
  const p99 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.99)];
  
  // 输出结果
  console.log(`总耗时: ${colors.yellow}${totalDuration}ms${colors.reset}`);
  console.log(`成功率: ${successCount}/${userCount} (${((successCount/userCount)*100).toFixed(1)}%)`);
  console.log(`平均响应时间: ${colors.yellow}${avgDuration.toFixed(1)}ms${colors.reset}`);
  console.log(`最小响应时间: ${colors.green}${minDuration}ms${colors.reset}`);
  console.log(`最大响应时间: ${colors.red}${maxDuration}ms${colors.reset}`);
  console.log(`P50: ${p50}ms | P95: ${p95}ms | P99: ${p99}ms`);
  
  if (failCount > 0) {
    console.log(`${colors.red}失败请求:${colors.reset}`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  用户${r.userId}: ${r.error || `HTTP ${r.statusCode}`}`);
    });
  }
  
  return {
    testName,
    totalDuration,
    successCount,
    failCount,
    avgDuration,
    minDuration,
    maxDuration,
    p50, p95, p99,
    results
  };
}

// 模拟完整用户流程
async function simulateUserFlow(userId, companyId, positionId) {
  const flowStart = Date.now();
  const flowResults = [];
  
  // 1. 获取公司列表
  const companiesStart = Date.now();
  const companiesResult = await testGetCompanies(userId);
  flowResults.push({ step: 'companies', duration: companiesResult.duration, success: companiesResult.success });
  
  // 2. 获取岗位列表
  const positionsResult = await testGetPositions(userId, companyId);
  flowResults.push({ step: 'positions', duration: positionsResult.duration, success: positionsResult.success });
  
  // 3. 获取评估数据
  const evalsResult = await testGetEvaluations(userId, positionId);
  flowResults.push({ step: 'evaluations', duration: evalsResult.duration, success: evalsResult.success });
  
  // 4. 批量保存评分
  const saveResult = await testBatchSave(userId, positionId);
  flowResults.push({ step: 'batchSave', duration: saveResult.duration, success: saveResult.success });
  
  const flowEnd = Date.now();
  const flowDuration = flowEnd - flowStart;
  
  return {
    userId,
    totalDuration: flowDuration,
    steps: flowResults,
    allSuccess: flowResults.every(r => r.success)
  };
}

// 完整流程压力测试
async function runFullFlowTest(userCount, companyId, positionId) {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     完整用户流程压力测试 (${userCount}人并发)                  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  
  const startTime = Date.now();
  
  // 创建所有用户的测试Promise
  const promises = [];
  for (let i = 1; i <= userCount; i++) {
    promises.push(simulateUserFlow(i, companyId, positionId));
  }
  
  // 并发执行
  const results = await Promise.all(promises);
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // 统计结果
  const successCount = results.filter(r => r.allSuccess).length;
  const durations = results.map(r => r.totalDuration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  // 各步骤统计
  const stepStats = {};
  ['companies', 'positions', 'evaluations', 'batchSave'].forEach(step => {
    const stepDurations = results.map(r => r.steps.find(s => s.step === step)?.duration || 0);
    stepStats[step] = {
      avg: stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length,
      max: Math.max(...stepDurations),
      successRate: results.filter(r => r.steps.find(s => s.step === step)?.success).length / userCount * 100
    };
  });
  
  console.log(`\n${colors.cyan}=== 总体结果 ===${colors.reset}`);
  console.log(`总耗时: ${colors.yellow}${totalDuration}ms${colors.reset}`);
  console.log(`完全成功用户: ${successCount}/${userCount} (${((successCount/userCount)*100).toFixed(1)}%)`);
  console.log(`平均完整流程耗时: ${colors.yellow}${avgDuration.toFixed(1)}ms${colors.reset}`);
  console.log(`最快用户: ${colors.green}${minDuration}ms${colors.reset}`);
  console.log(`最慢用户: ${colors.red}${maxDuration}ms${colors.reset}`);
  
  console.log(`\n${colors.cyan}=== 各步骤详情 ===${colors.reset}`);
  console.log(`获取公司列表: 平均 ${stepStats.companies.avg.toFixed(1)}ms, 成功率 ${stepStats.companies.successRate.toFixed(1)}%`);
  console.log(`获取岗位列表: 平均 ${stepStats.positions.avg.toFixed(1)}ms, 成功率 ${stepStats.positions.successRate.toFixed(1)}%`);
  console.log(`获取评估数据: 平均 ${stepStats.evaluations.avg.toFixed(1)}ms, 成功率 ${stepStats.evaluations.successRate.toFixed(1)}%`);
  console.log(`批量保存评分: 平均 ${stepStats.batchSave.avg.toFixed(1)}ms, 成功率 ${stepStats.batchSave.successRate.toFixed(1)}%`);
  
  // 吞吐量计算
  const throughput = (userCount / (totalDuration / 1000)).toFixed(2);
  console.log(`\n${colors.cyan}=== 性能指标 ===${colors.reset}`);
  console.log(`吞吐量: ${colors.green}${throughput} 请求/秒${colors.reset}`);
  console.log(`平均每用户完成时间: ${avgDuration.toFixed(1)}ms`);
  
  return {
    totalDuration,
    successCount,
    avgDuration,
    minDuration,
    maxDuration,
    stepStats,
    throughput
  };
}

// 主测试函数
async function main() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     岗位价值评估系统 - 压力测试报告                      ║${colors.reset}`);
  console.log(`${colors.blue}║     并发用户数: ${CONCURRENT_USERS}人                                    ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n${colors.yellow}测试时间: ${new Date().toLocaleString('zh-CN')}${colors.reset}`);
  
  // 先获取公司ID和岗位ID用于后续测试
  console.log(`\n${colors.cyan}准备测试数据...${colors.reset}`);
  
  let companyId = null;
  let positionId = null;
  
  try {
    // 获取公司列表
    const companiesOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/companies',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    const companiesResult = await httpRequest(companiesOptions);
    if (companiesResult.success) {
      const response = JSON.parse(companiesResult.data);
      const companies = response.data || response;
      if (companies.length > 0) {
        companyId = companies[0].id;
        console.log(`使用公司: ${companies[0].name} (${companyId})`);
      }
    }
    
    // 获取岗位列表
    if (companyId) {
      const positionsOptions = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/positions?companyId=${companyId}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
      const positionsResult = await httpRequest(positionsOptions);
      if (positionsResult.success) {
        const response = JSON.parse(positionsResult.data);
        const positions = response.data || response;
        if (positions.length > 0) {
          positionId = positions[0].id;
          console.log(`使用岗位: ${positions[0].name} (${positionId})`);
        }
      }
    }
  } catch (error) {
    console.error('准备测试数据失败:', error.message);
  }
  
  // 单接口压力测试
  console.log(`\n${colors.blue}════════════════ 单接口压力测试 ════════════════${colors.reset}`);
  
  const testResults = [];
  
  testResults.push(await runConcurrentTest(
    '获取公司列表',
    (userId) => testGetCompanies(userId),
    CONCURRENT_USERS
  ));
  
  testResults.push(await runConcurrentTest(
    '获取岗位列表',
    (userId) => testGetPositions(userId, companyId || 'test'),
    CONCURRENT_USERS
  ));
  
  testResults.push(await runConcurrentTest(
    '获取排名数据',
    (userId) => testGetRankings(userId),
    CONCURRENT_USERS
  ));
  
  // 完整流程测试
  console.log(`\n${colors.blue}════════════════ 完整用户流程测试 ════════════════${colors.reset}`);
  
  if (companyId && positionId) {
    const fullFlowResult = await runFullFlowTest(CONCURRENT_USERS, companyId, positionId);
    
    // 清理测试数据
    console.log(`\n${colors.yellow}清理测试数据...${colors.reset}`);
    // 这里可以添加清理逻辑，但不影响测试结果
  } else {
    console.log(`${colors.red}无法执行完整流程测试: 缺少公司或岗位数据${colors.reset}`);
  }
  
  // 测试总结
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║                    测试总结                              ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n${colors.cyan}单接口测试结果:${colors.reset}`);
  testResults.forEach(r => {
    const status = r.failCount === 0 ? colors.green + '✓' : colors.red + '✗';
    console.log(`  ${status} ${r.testName}: 平均 ${r.avgDuration.toFixed(1)}ms, 成功率 ${((r.successCount/CONCURRENT_USERS)*100).toFixed(1)}%${colors.reset}`);
  });
  
  console.log(`\n${colors.cyan}系统评估:${colors.reset}`);
  const overallSuccessRate = testResults.reduce((sum, r) => sum + r.successCount, 0) / (testResults.length * CONCURRENT_USERS) * 100;
  const overallAvgDuration = testResults.reduce((sum, r) => sum + r.avgDuration, 0) / testResults.length;
  
  if (overallSuccessRate === 100 && overallAvgDuration < 500) {
    console.log(`  ${colors.green}✓ 系统表现优秀: 所有请求成功，响应时间快${colors.reset}`);
  } else if (overallSuccessRate >= 95 && overallAvgDuration < 1000) {
    console.log(`  ${colors.yellow}⚠ 系统表现良好: 成功率高，响应时间可接受${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ 系统需要优化: 存在失败或响应过慢${colors.reset}`);
  }
  
  console.log(`\n${colors.yellow}测试完成时间: ${new Date().toLocaleString('zh-CN')}${colors.reset}\n`);
}

main().catch(console.error);
