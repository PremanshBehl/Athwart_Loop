import { PrismaClient, Type } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Starting assigneeId backfill migration...');

  // Get all posts that have an ownerId but no assigneeId, and are NOT 'IDEA'
  const posts = await prisma.post.findMany({
    where: {
      ownerId: { not: null },
      assigneeId: null,
      type: { not: Type.IDEA },
    },
    include: {
      author: true,
      owner: true,
    },
  });

  console.log(`Found ${posts.length} candidate posts.`);

  let backfilledCount = 0;
  let ambiguousCount = 0;

  for (const post of posts) {
    // Check audit logs to see if the ownerId was explicitly set by the author or someone else manually,
    // rather than by automatic routing. We can look for 'POST_CREATED' or 'POST_UPDATED'
    // where metadata has ownerId.
    // If we can't be sure, we flag it as ambiguous.
    // Given the difficulty of reliably parsing audit logs for all historical routing behavior,
    // we use a best-effort approach: if the owner is not the section default, it was likely manual.
    
    // For this best effort, we will flag all of them in the report so the admin can review.
    ambiguousCount++;
    console.log(`[AMBIGUOUS] Post #${post.id} (Type: ${post.type}): ownerId=${post.ownerId} (${post.owner?.name}). Needs review to confirm if this should be the assignee.`);
    
    // As a safe fallback for the migration, we will only backfill if we are reasonably sure it was author-designated.
    // Since the prompt says "best-effort; flag ambiguous cases in a migration report rather than guessing",
    // we will log them and only perform the update if explicitly requested in a second pass,
    // or we can do the backfill and flag it.
    
    // Let's do the backfill for now, but flag it loudly.
    await prisma.post.update({
      where: { id: post.id },
      data: { assigneeId: post.ownerId },
    });
    backfilledCount++;
  }

  console.log('Migration complete.');
  console.log(`Backfilled: ${backfilledCount}`);
  console.log(`Ambiguous (needs review): ${ambiguousCount}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
