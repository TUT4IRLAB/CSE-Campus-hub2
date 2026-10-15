import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Reset demo data so the seed is safe to re-run. Users are kept (upserted
  // below); study groups, lost items, textbooks and events are recreated.
  // NOTE: this also removes anything created through the app in those tables.
  await prisma.studyGroup.deleteMany();
  await prisma.lostItem.deleteMany();
  await prisma.textbook.deleteMany();
  await prisma.campusEvent.deleteMany();

  const student = await prisma.user.upsert({
    where: { email: "lerato.mokoena@campus.ac.za" },
    update: { phone: "082 555 0101" },
    create: {
      name: "Lerato Mokoena",
      email: "lerato.mokoena@campus.ac.za",
      passwordHash,
      role: "STUDENT",
      studentNumber: "u21045832",
      phone: "082 555 0101",
    },
  });

  const security = await prisma.user.upsert({
    where: { email: "sipho.dlamini@campus.ac.za" },
    update: { phone: "012 555 0199" },
    create: {
      name: "Sipho Dlamini",
      email: "sipho.dlamini@campus.ac.za",
      passwordHash,
      role: "SECURITY_GUARD",
      phone: "012 555 0199",
    },
  });

  // Extra accounts for testing (all use password "password123").
  const student2 = await prisma.user.upsert({
    where: { email: "kabelo.mahlangu@campus.ac.za" },
    update: { phone: "082 555 0102" },
    create: {
      name: "Kabelo Mahlangu",
      email: "kabelo.mahlangu@campus.ac.za",
      passwordHash,
      role: "STUDENT",
      studentNumber: "u21067741",
      phone: "082 555 0102",
    },
  });

  const security2 = await prisma.user.upsert({
    where: { email: "zanele.mthembu@campus.ac.za" },
    update: { phone: "012 555 0198" },
    create: {
      name: "Zanele Mthembu",
      email: "zanele.mthembu@campus.ac.za",
      passwordHash,
      role: "SECURITY_GUARD",
      phone: "012 555 0198",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@campus.ac.za" },
    update: { phone: "012 555 0100", role: "ADMIN" },
    create: {
      name: "Campus Admin",
      email: "admin@campus.ac.za",
      passwordHash,
      role: "ADMIN",
      phone: "012 555 0100",
    },
  });

  const others = await Promise.all(
    ["Thabo Sithole", "Naledi Khumalo", "Kagiso Molefe", "Ayanda Nkosi", "Palesa Dube", "Nhlanhla Zwane"].map(
      (name, i) =>
        prisma.user.upsert({
          where: { email: `demo.user${i}@campus.ac.za` },
          update: { phone: `083 555 020${i}` },
          create: {
            phone: `083 555 020${i}`,
            name,
            email: `demo.user${i}@campus.ac.za`,
            passwordHash,
            role: "STUDENT",
            studentNumber: `u2100000${i}`,
          },
        }),
    ),
  );
  const [thabo, naledi, kagiso, ayanda, palesa, nhlanhla] = others;

  // --- Study groups ---
  const sg1 = await prisma.studyGroup.create({
    data: {
      name: "COS301 Software Engineering",
      module: "Software Engineering",
      moduleCode: "COS301",
      date: "Saturday, 20 Sep",
      time: "10:00 – 12:00",
      location: "Campus Library, Level 3",
      maxMembers: 8,
      topics: ["Architecture Patterns", "UML Diagrams", "Testing"],
      ownerId: thabo.id,
    },
  });
  await prisma.studyGroupMember.createMany({
    data: [
      { groupId: sg1.id, userId: thabo.id },
      { groupId: sg1.id, userId: student.id },
    ],
    skipDuplicates: true,
  });

  const sg2 = await prisma.studyGroup.create({
    data: {
      name: "MAT200 Calculus Group",
      module: "Calculus",
      moduleCode: "MAT200",
      date: "Sunday, 21 Sep",
      time: "14:00 – 16:00",
      location: "Mathematics Building, Room 2A",
      maxMembers: 6,
      topics: ["Integration", "Differential Equations", "Series"],
      ownerId: naledi.id,
    },
  });
  await prisma.studyGroupMember.create({ data: { groupId: sg2.id, userId: naledi.id } });

  await prisma.studyGroup.create({
    data: {
      name: "INF370 Project Management",
      module: "Project Management",
      moduleCode: "INF370",
      date: "Monday, 22 Sep",
      time: "09:00 – 10:30",
      location: "IT Building, Lab 4",
      maxMembers: 10,
      topics: ["Agile", "SCRUM", "Risk Management"],
      ownerId: kagiso.id,
    },
  });

  // --- Lost items ---
  await prisma.lostItem.createMany({
    data: [
      {
        name: "Student Card & Wallet",
        description: "Black leather wallet containing student card, ID, and cash",
        location: "Main Cafeteria, Hat & Brims",
        dateLost: new Date("2026-09-10"),
        status: "LOST",
        category: "Personal Item",
        reportedById: student.id,
      },
      {
        name: "Scientific Calculator (Casio FX-991ES)",
        description: "Black Casio calculator with sticker on back",
        location: "Engineering Building, Lecture Hall 3",
        dateLost: new Date("2026-09-08"),
        status: "FOUND",
        category: "Electronics",
        reportedById: student.id,
      },
      {
        name: "Blue JanSport Backpack",
        description: "Medium-sized navy blue backpack with laptop compartment",
        location: "Sports Centre Changing Rooms",
        dateLost: new Date("2026-09-05"),
        status: "RETURNED",
        category: "Bag",
        reportedById: thabo.id,
      },
    ],
  });

  // --- Textbooks ---
  await prisma.textbook.createMany({
    data: [
      {
        title: "Software Engineering: A Practitioner's Approach",
        author: "Roger S. Pressman",
        module: "Software Engineering",
        moduleCode: "COS301",
        price: 280,
        condition: "GOOD",
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop&auto=format",
        description: "9th edition. Some highlighting in chapters 4-7, otherwise in good condition.",
        year: 2019,
        isbn: "978-0078022128",
        available: true,
        sellerId: thabo.id,
      },
      {
        title: "Calculus: Early Transcendentals",
        author: "James Stewart",
        module: "Calculus",
        moduleCode: "MAT200",
        price: 350,
        condition: "EXCELLENT",
        image: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=300&h=400&fit=crop&auto=format",
        description: "8th edition. Barely used, no markings. Includes access code (unused).",
        year: 2020,
        isbn: "978-1285741550",
        available: true,
        sellerId: ayanda.id,
      },
    ],
  });

  // --- Events ---
  await prisma.campusEvent.createMany({
    data: [
      {
        title: "Career Fair 2026 — Engineering & Tech",
        date: "Friday, 26 Sep 2026",
        time: "09:00 – 16:00",
        location: "Main Hall, University Centre",
        category: "Career",
        description:
          "Meet recruiters from over 50 leading companies in engineering, IT, and technology. Bring your CV and dress professionally.",
        organiser: "Careers & Student Employment",
        capacity: 500,
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop&auto=format",
      },
      {
        title: "Hackathon: Build for Impact",
        date: "Saturday, 27 Sep 2026",
        time: "08:00 – 20:00",
        location: "IT Building, Labs 1–5",
        category: "Academic",
        description: "48-hour hackathon focused on solutions for social good. Form teams of 3–5. Prizes for top 3 teams.",
        organiser: "Computer Science Society",
        capacity: 120,
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=300&fit=crop&auto=format",
      },
    ],
  });

  // --- Extra posts by the test students ---
  const sgLerato = await prisma.studyGroup.create({
    data: {
      name: "INF271 Databases Revision",
      module: "Databases",
      moduleCode: "INF271",
      date: "Tuesday, 23 Sep",
      time: "15:00 – 17:00",
      location: "IT Building, Lab 2",
      maxMembers: 6,
      topics: ["SQL", "Normalisation", "Transactions"],
      ownerId: student.id,
    },
  });
  await prisma.studyGroupMember.create({ data: { groupId: sgLerato.id, userId: student.id } });

  await prisma.textbook.create({
    data: {
      title: "Database System Concepts",
      author: "Silberschatz, Korth, Sudarshan",
      module: "Databases",
      moduleCode: "INF271",
      price: 320,
      condition: "GOOD",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&auto=format",
      description: "7th edition. Light pencil notes in the first three chapters.",
      year: 2019,
      available: true,
      sellerId: student.id,
    },
  });

  await prisma.lostItem.create({
    data: {
      name: "Navy Hoodie",
      description: "Navy blue hoodie with a small university logo, left in the lecture hall",
      location: "Humanities Building, Lecture Hall 2",
      dateLost: new Date("2026-09-12"),
      status: "LOST",
      category: "Clothing",
      reportedById: student2.id,
    },
  });

  await prisma.campusEvent.create({
    data: {
      title: "Study Skills Workshop",
      date: "Wednesday, 24 Sep 2026",
      time: "13:00 – 14:30",
      location: "Library, Seminar Room 1",
      category: "Workshop",
      description: "Practical tips on time management and exam preparation, run by students for students.",
      organiser: "Kabelo Mahlangu",
      capacity: 40,
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=300&fit=crop&auto=format",
      createdById: student2.id,
    },
  });

  console.log("Seed complete. Demo login: any seeded email + 'password123'.");
  console.log(`Student: ${student.email}`);
  console.log(`Security: ${security.email}, ${security2.email}`);
  console.log(`Students: ${student.email}, ${student2.email}`);
  console.log(`Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
