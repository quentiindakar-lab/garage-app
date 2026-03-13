import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@btppro.fr" },
    update: {
      name: "Administrateur",
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: "admin@btppro.fr",
      name: "Administrateur",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Seed terminé !");
  console.log(`Utilisateur créé : ${admin.name} (${admin.email})`);
  console.log(`Identifiants : admin@btppro.fr / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
