import prisma from "../../../lib/prisma";

// POST /api/collage
export default async function handle(req, res) {
  const { src, values } = req.body;

  const result = await prisma.collage.create({
    data: {
      src,
      values,
    },
  });
  res.json(result);
}
