const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password123@127.0.0.1:5433/fitconnect'
    }
  }
});

async function main() {
  const posts = await prisma.post.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  console.log(`Found ${posts.length} posts in database.`);
  posts.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Author: ${p.user?.name} (${p.user?.email}) | Content: "${p.content?.slice(0, 50)}" | Likes: ${p._count.likes} | Comments: ${p._count.comments}`);
  });

  if (posts.length > 0) {
    const deletedComments = await prisma.comment.deleteMany({});
    console.log(`Deleted ${deletedComments.count} comments.`);

    const deletedLikes = await prisma.like.deleteMany({});
    console.log(`Deleted ${deletedLikes.count} likes.`);

    const deletedPosts = await prisma.post.deleteMany({});
    console.log(`Successfully deleted ${deletedPosts.count} community posts!`);
  } else {
    console.log('No posts to delete.');
  }
}

main()
  .catch(err => {
    console.error('Error in delete posts script:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
