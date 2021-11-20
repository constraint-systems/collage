import prisma from "../../../lib/prisma";

// GET /api/collage/mostRecent
export default async function handle(req, res) {
  const result = await prisma.collage.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      src: true,
      values: true,
    },
  });
  return res.json(result);
}
