import { prisma } from "../shared/db/prisma.js";

async function main() {
  // MVP placeholder: follow-up tasks will run here after EP-06.
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

