const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make HTTP requests
function request(path, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('Starting School Facility Portal API Integration Test');
  console.log('==================================================\n');

  let parentToken = '';
  let parentId = '';
  let adminToken = '';
  let adminId = '';
  let testIssueId = '';

  const timestamp = Date.now();
  const parentEmail = `parent_${timestamp}@school.org`;
  const adminEmail = `admin_${timestamp}@school.org`;
  const schoolId = `SCH-${timestamp}`;

  try {
    // 1. Register a Parent
    console.log(`[Step 1] Registering a new Parent: ${parentEmail}...`);
    const regParentRes = await request('/api/auth/register', 'POST', {}, {
      name: 'Parent Tester',
      email: parentEmail,
      password: 'password123',
      role: 'parent',
      schoolId: schoolId
    });

    if (regParentRes.statusCode !== 200) {
      throw new Error(`Failed to register parent. Status: ${regParentRes.statusCode}, Body: ${JSON.stringify(regParentRes.body)}`);
    }
    console.log('✔ Parent registered successfully.');
    parentToken = regParentRes.body.token;
    parentId = regParentRes.body.user.id;

    // 2. Register an Admin
    console.log(`[Step 2] Registering a new Admin: ${adminEmail}...`);
    const regAdminRes = await request('/api/auth/register', 'POST', {}, {
      name: 'Admin Tester',
      email: adminEmail,
      password: 'adminpassword123',
      role: 'admin',
      schoolId: schoolId
    });

    if (regAdminRes.statusCode !== 200) {
      throw new Error(`Failed to register admin. Status: ${regAdminRes.statusCode}, Body: ${JSON.stringify(regAdminRes.body)}`);
    }
    console.log('✔ Admin registered successfully.');
    adminToken = regAdminRes.body.token;
    adminId = regAdminRes.body.user.id;

    // 3. Log in as Parent
    console.log('[Step 3] Logging in as Parent...');
    const loginParentRes = await request('/api/auth/login', 'POST', {}, {
      email: parentEmail,
      password: 'password123'
    });

    if (loginParentRes.statusCode !== 200) {
      throw new Error(`Failed to log in as parent. Status: ${loginParentRes.statusCode}`);
    }
    console.log('✔ Parent logged in successfully.');

    // 4. Report a new issue as Parent
    console.log('[Step 4] Reporting a new issue as Parent...');
    const reportRes = await request('/api/issues', 'POST', {
      'Authorization': `Bearer ${parentToken}`
    }, {
      title: 'Water Leak in Science Lab',
      description: 'The sink pipe is leaking water, causing a slipping hazard.',
      category: 'Sanitation',
      location: 'Science Lab, Ground Floor',
      priority: 'high'
    });

    if (reportRes.statusCode !== 201) {
      throw new Error(`Failed to report issue. Status: ${reportRes.statusCode}, Body: ${JSON.stringify(reportRes.body)}`);
    }
    testIssueId = reportRes.body._id;
    console.log(`✔ Issue reported successfully. Issue ID: ${testIssueId}`);

    // 5. Verify the reported issue appears in Parent's dashboard issues list
    console.log('[Step 5] Fetching issues list as Parent...');
    const getIssuesRes = await request('/api/issues', 'GET', {
      'Authorization': `Bearer ${parentToken}`
    });

    if (getIssuesRes.statusCode !== 200) {
      throw new Error(`Failed to fetch issues. Status: ${getIssuesRes.statusCode}`);
    }
    const issueFound = getIssuesRes.body.find(i => i._id === testIssueId);
    if (!issueFound) {
      throw new Error('Reported issue was not found in the issues list.');
    }
    console.log(`✔ Issue verified in list with status: "${issueFound.status}".`);

    // 6. Check Dashboard Statistics
    console.log('[Step 6] Verifying Dashboard statistics...');
    const statsRes = await request('/api/issues/stats', 'GET', {
      'Authorization': `Bearer ${parentToken}`
    });
    if (statsRes.statusCode !== 200) {
      throw new Error('Failed to fetch stats');
    }
    console.log(`✔ Dashboard stats: Total: ${statsRes.body.total}, Pending: ${statsRes.body.pending}, In Progress: ${statsRes.body.inProgress}, Resolved: ${statsRes.body.resolved}.`);

    // 7. Update status to In Progress as Admin
    console.log('[Step 7] Updating issue status to "in-progress" as Admin...');
    const updateProgressRes = await request(`/api/issues/${testIssueId}`, 'PUT', {
      'Authorization': `Bearer ${adminToken}`
    }, {
      status: 'in-progress',
      assignedStaff: 'Mr. Fixit (Plumbing Staff)',
      estimatedResolutionTime: '2 days',
      notes: 'Plumber has been dispatched to replace the pipeline.'
    });

    if (updateProgressRes.statusCode !== 200) {
      throw new Error(`Failed to update status to in-progress. Status: ${updateProgressRes.statusCode}, Body: ${JSON.stringify(updateProgressRes.body)}`);
    }
    console.log('✔ Issue status updated to "in-progress" successfully.');

    // 8. Update status to Resolved as Admin
    console.log('[Step 8] Updating issue status to "resolved" as Admin...');
    const updateResolvedRes = await request(`/api/issues/${testIssueId}`, 'PUT', {
      'Authorization': `Bearer ${adminToken}`
    }, {
      status: 'resolved',
      notes: 'The pipeline has been replaced, leak is fixed, and area is dried.'
    });

    if (updateResolvedRes.statusCode !== 200) {
      throw new Error(`Failed to update status to resolved. Status: ${updateResolvedRes.statusCode}`);
    }
    console.log('✔ Issue status updated to "resolved" successfully.');

    // 9. Fetch issue as Parent to verify Status and Timeline events
    console.log('[Step 9] Verifying updated issue & timeline as Parent...');
    const getSingleIssueRes = await request(`/api/issues/${testIssueId}`, 'GET', {
      'Authorization': `Bearer ${parentToken}`
    });

    if (getSingleIssueRes.statusCode !== 200) {
      throw new Error(`Failed to fetch single issue. Status: ${getSingleIssueRes.statusCode}`);
    }

    const updatedIssue = getSingleIssueRes.body;
    console.log(`✔ Verified status is: "${updatedIssue.status}"`);
    console.log('✔ Timeline events:');
    updatedIssue.timeline.forEach((event, idx) => {
      console.log(`   [Event ${idx + 1}] Status: ${event.status} | Notes: ${event.notes} (${new Date(event.timestamp).toLocaleTimeString()})`);
    });

    if (updatedIssue.timeline.length !== 3) {
      throw new Error(`Expected timeline length of 3, but got ${updatedIssue.timeline.length}`);
    }

    // 10. Check Notifications for Parent
    console.log('[Step 10] Verifying Notification triggered for Parent...');
    const notificationsRes = await request('/api/notifications', 'GET', {
      'Authorization': `Bearer ${parentToken}`
    });

    if (notificationsRes.statusCode !== 200) {
      throw new Error(`Failed to fetch notifications. Status: ${notificationsRes.statusCode}`);
    }

    console.log('✔ Notifications list received:');
    notificationsRes.body.forEach((n, idx) => {
      console.log(`   [Notification ${idx + 1}] Message: "${n.message}" | Read: ${n.read}`);
    });

    const relevantNotification = notificationsRes.body.find(n => n.issueId === testIssueId);
    if (!relevantNotification) {
      throw new Error('No notification found for the parent regarding their updated issue.');
    }
    console.log('✔ Correct notification target verified.');

    // 11. Mark all notifications as read
    console.log('[Step 11] Marking notifications as read...');
    const readAllRes = await request('/api/notifications/read/all', 'PUT', {
      'Authorization': `Bearer ${parentToken}`
    });
    if (readAllRes.statusCode !== 200) {
      throw new Error(`Failed to mark notifications as read. Status: ${readAllRes.statusCode}`);
    }
    console.log(`✔ Read status updated successfully: ${readAllRes.body.message} (${readAllRes.body.count} updated).`);

    console.log('\n==================================================');
    console.log('✔ ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✔');
    console.log('==================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST FAILED with error:');
    console.error(err);
    process.exit(1);
  }
}

// Ensure the server has a tiny delay or is ready
setTimeout(runTests, 500);
