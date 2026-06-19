import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ticketsystem.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@ticketsystem.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);

  const articles = [
    {
      title: "How to Reset Your Password",
      content:
        "To reset your password, visit the login page and click 'Forgot Password'. Enter your registered email address and follow the instructions sent to your inbox. The reset link expires after 24 hours.",
      category: "GENERAL",
    },
    {
      title: "Refund Policy",
      content:
        "Refund requests must be submitted within 30 days of purchase. To request a refund, provide your order number and reason for the request. Refunds are processed within 5-7 business days after approval.",
      category: "REFUND",
    },
    {
      title: "Troubleshooting Login Issues",
      content:
        "If you cannot log in, first ensure your email and password are correct. Clear your browser cache and cookies. If the issue persists, try a different browser or disable browser extensions. Contact support if none of these steps resolve the issue.",
      category: "TECHNICAL",
    },
    {
      title: "Course Access and Enrollment",
      content:
        "After enrollment, courses are accessible within 15 minutes. Navigate to your dashboard to find enrolled courses. If a course is not visible, verify your enrollment status or contact support with your order confirmation.",
      category: "GENERAL",
    },
    {
      title: "System Requirements",
      content:
        "Our platform supports Chrome, Firefox, Safari, and Edge (latest versions). A stable internet connection of at least 5 Mbps is recommended for video content. Mobile access is available through responsive web design.",
      category: "TECHNICAL",
    },
  ];

  const existingCount = await prisma.knowledgeBaseArticle.count();
  if (existingCount === 0) {
    await prisma.knowledgeBaseArticle.createMany({ data: articles });
  }

  console.log(`Seeded ${articles.length} knowledge base articles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
