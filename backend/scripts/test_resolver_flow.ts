import { PrismaClient, Type, Status, Role, Section } from '@prisma/client';
import { WorkflowService } from '../src/services/workflow.service';

const prisma = new PrismaClient();
const workflowService = new WorkflowService();

async function runTests() {
  console.log('Starting Resolver Flow Tests...');

  // 1. Setup mock users
  const admin = await prisma.user.create({ data: { email: 'admin_test@test.com', name: 'Admin Test', role: Role.ADMIN, passwordHash: 'hash' } });
  const founder = await prisma.user.create({ data: { email: 'founder_test@test.com', name: 'Founder Test', role: Role.FOUNDER, passwordHash: 'hash' } });
  const author = await prisma.user.create({ data: { email: 'author_test@test.com', name: 'Author Test', role: Role.FRONTEND, passwordHash: 'hash' } });
  const assignee = await prisma.user.create({ data: { email: 'assignee_test@test.com', name: 'Assignee Test', role: Role.BACKEND, passwordHash: 'hash' } });
  const owner = await prisma.user.create({ data: { email: 'owner_test@test.com', name: 'Owner Test', role: Role.BACKEND, passwordHash: 'hash' } });
  const randomUser = await prisma.user.create({ data: { email: 'random_test@test.com', name: 'Random Test', role: Role.FRONTEND, passwordHash: 'hash' } });

  const cleanup = async () => {
    await prisma.post.deleteMany({ where: { authorId: author.id } });
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, founder.id, author.id, assignee.id, owner.id, randomUser.id] } } });
  };

  try {
    // --- TEST 1: Question ---
    console.log('\n--- Test 1: Question ---');
    const qPost = await prisma.post.create({
      data: {
        title: 'Q Test', description: 'Desc', type: Type.QUESTION, status: Status.OPEN,
        section: Section.GENERAL, authorId: author.id, assigneeId: assignee.id
      }
    });

    let successCount = 0;
    
    // Author can resolve Question
    try { await workflowService.transitionStatus(qPost.id, Status.RESOLVED, author.id, { resolution: 'ANSWERED' }); successCount++; } catch (e) { console.error('Failed Author Question:', e); }
    // Reset to OPEN
    await prisma.post.update({ where: { id: qPost.id }, data: { status: Status.OPEN } });
    // Random user CANNOT resolve Question
    try { await workflowService.transitionStatus(qPost.id, Status.RESOLVED, randomUser.id, { resolution: 'ANSWERED' }); console.error('Failed: Random resolved Question'); } catch (e) { successCount++; }
    
    console.log(`Question Tests Passed: ${successCount}/2`);

    // --- TEST 2: Problem ---
    console.log('\n--- Test 2: Problem ---');
    const pPost = await prisma.post.create({
      data: {
        title: 'P Test', description: 'Desc', type: Type.PROBLEM, status: Status.OPEN,
        section: Section.GENERAL, authorId: author.id, assigneeId: assignee.id, ownerId: owner.id
      }
    });

    successCount = 0;
    // Assignee can resolve Problem
    try { await workflowService.transitionStatus(pPost.id, Status.RESOLVED, assignee.id, { resolution: 'FIXED', buildIssueUrl: 'http://test' }); successCount++; } catch (e) { console.error('Failed Assignee Problem:', e); }
    // Reset to OPEN
    await prisma.post.update({ where: { id: pPost.id }, data: { status: Status.OPEN } });
    // Author CANNOT resolve Problem (if not assignee)
    try { await workflowService.transitionStatus(pPost.id, Status.RESOLVED, author.id, { resolution: 'FIXED', buildIssueUrl: 'http://test' }); console.error('Failed: Author resolved Problem'); } catch (e) { successCount++; }
    
    console.log(`Problem Tests Passed: ${successCount}/2`);

    // --- TEST 3: Idea ---
    console.log('\n--- Test 3: Idea ---');
    const iPost = await prisma.post.create({
      data: {
        title: 'I Test', description: 'Desc', type: Type.IDEA, status: Status.OPEN,
        section: Section.GENERAL, authorId: author.id
      }
    });

    successCount = 0;
    // Founder can resolve Idea
    try { await workflowService.transitionStatus(iPost.id, Status.RESOLVED, founder.id, { resolution: 'APPROVED', buildIssueUrl: 'http://test' }); successCount++; } catch (e) { console.error('Failed Founder Idea:', e); }
    // Reset to OPEN
    await prisma.post.update({ where: { id: iPost.id }, data: { status: Status.OPEN } });
    // Author CANNOT resolve Idea
    try { await workflowService.transitionStatus(iPost.id, Status.RESOLVED, author.id, { resolution: 'APPROVED', buildIssueUrl: 'http://test' }); console.error('Failed: Author resolved Idea'); } catch (e) { successCount++; }
    
    console.log(`Idea Tests Passed: ${successCount}/2`);

  } finally {
    await cleanup();
    console.log('\nCleanup Complete.');
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
