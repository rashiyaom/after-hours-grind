import { PrismaClient } from '@prisma/client';

type RawRow = Record<string, any>;

async function paginatedRaw(prisma: PrismaClient, baseQuery: string, batchSize = 100, maxBatches = 1000) {
  const results: RawRow[] = [];
  for (let i = 0; i < maxBatches; i++) {
    const offset = i * batchSize;
    const q = `${baseQuery} ORDER BY 1 LIMIT ${batchSize} OFFSET ${offset}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // @ts-ignore runtime raw
    // use $queryRawUnsafe to append numeric limits safely
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // @ts-ignore
    // eslint-disable-next-line no-await-in-loop
    const rows = await (prisma as any).$queryRawUnsafe(q);
    if (!rows || rows.length === 0) break;
    results.push(...rows);
    if (rows.length < batchSize) break;
  }
  return results;
}

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required.');
    process.exit(2);
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  try {
    const batchSize = Number(process.env.AUDIT_BATCH_SIZE || '200');
    const maxBatches = Number(process.env.AUDIT_MAX_BATCHES || '1000');

    const report: Record<string, any> = {};

    report.counts = {};
    report.counts.users = await prisma.user.count();
    report.counts.posts = await prisma.post.count();
    report.counts.comments = await prisma.comment.count();
    report.counts.submissions = await prisma.submission.count();

    report.orphanedPosts = await paginatedRaw(prisma, `SELECT p.id FROM "Post" p LEFT JOIN "User" u ON u.id = p."userId" WHERE u.id IS NULL`, batchSize, maxBatches);

    report.postsMissingMedia = await paginatedRaw(prisma, `SELECT id, "type", "mediaUrl" FROM "Post" WHERE "type" IN ('image','video') AND ("mediaUrl" IS NULL OR "mediaUrl" = '')`, batchSize, maxBatches);

    report.studentsWithoutProfile = await paginatedRaw(prisma, `SELECT u.id, u.email FROM "User" u WHERE u.role = 'STUDENT' AND NOT EXISTS (SELECT 1 FROM "StudentProfile" s WHERE s."userId" = u.id)`, batchSize, maxBatches);

    report.orphanedComments = await paginatedRaw(prisma, `SELECT c.id FROM "Comment" c LEFT JOIN "Post" p ON p.id = c."postId" WHERE p.id IS NULL`, batchSize, maxBatches);
    report.orphanedCommentUsers = await paginatedRaw(prisma, `SELECT c.id FROM "Comment" c LEFT JOIN "User" u ON u.id = c."userId" WHERE u.id IS NULL`, batchSize, maxBatches);

    report.orphanedLikes = await paginatedRaw(prisma, `SELECT l.id FROM "Like" l LEFT JOIN "Post" p ON p.id = l."postId" WHERE p.id IS NULL`, batchSize, maxBatches);
    report.orphanedLikeUsers = await paginatedRaw(prisma, `SELECT l.id FROM "Like" l LEFT JOIN "User" u ON u.id = l."userId" WHERE u.id IS NULL`, batchSize, maxBatches);

    report.orphanedSubmissions = await paginatedRaw(prisma, `SELECT s.id FROM "Submission" s LEFT JOIN "User" u ON u.id = s."studentId" WHERE u.id IS NULL`, batchSize, maxBatches);

    report.orphanedRefreshTokens = await paginatedRaw(prisma, `SELECT r.id FROM "RefreshToken" r LEFT JOIN "User" u ON u.id = r."userId" WHERE u.id IS NULL`, batchSize, maxBatches);

    report.recentPosts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, userId: true, mediaUrl: true, createdAt: true } });

    const md5Results = await (prisma as any).$queryRaw`
      SELECT 'User' as table_name, md5(string_agg(id || '|' || coalesce(email,''), ',')) as checksum FROM "User" UNION ALL
      SELECT 'Post' as table_name, md5(string_agg(id || '|' || coalesce("mediaUrl",''), ',')) as checksum FROM "Post";
    `;
    report.checksums = md5Results;

    const outFile = process.argv.find(a => a.startsWith('--out='))?.split('=')[1] || process.env.AUDIT_OUT_FILE;
    const json = JSON.stringify(report, null, 2);
    if (outFile) {
      // write to file
      // use fs write
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      fs.writeFileSync(outFile, json, { encoding: 'utf8' });
      console.log(`Audit written to ${outFile}`);
    } else {
      console.log(json);
    }

    await prisma.$disconnect();
    return 0;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Audit failed', err);
    try {
      await (global as any).prisma?.$disconnect();
    } catch (e) {
      // ignore
    }
    process.exit(3);
  }
}

run();
