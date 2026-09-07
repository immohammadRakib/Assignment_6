import app from "./app";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
// import { seedSuperAdmin, seedTesterAdmin, seedTesterDoctor } from "./app/utils/seed";
import { redisClient } from "./app/lib/redis";
import { transporter } from "./app/lib/nodemailer";

const PORT = config.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Prisma Connected Successfully");

    // if (!redisClient.isOpen) {
    //   await redisClient.connect();
    //   console.log(
    //     "Central Redis server connected and ready for Rate Limiting!",
    //   );
    // } else {
    //   console.log(
    //     "Redis connection already established background smoothly.",
    //   );
    // }

      try {
      if (!redisClient.isOpen) {
        // টাইমআউট বা ক্র্যাশ এড়াতে আমরা ৩ সেকেন্ডের একটি সেফটি চেক দিচ্ছি
        await Promise.race([
          redisClient.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Redis connection timeout")), 3000))
        ]);
        console.log("Central Redis server connected successfully!");
      } else {
        console.log("Redis connection already established background smoothly.");
      }
    } catch (redisError) {
      // 💡 রেডিস কানেক্ট না হতে পারলেও সার্ভার ক্র্যাশ করবে না, ব্যাকএন্ড চালু থাকবে!
      console.error("⚠️ Redis connection failed or timeout, bypassing safely to keep server running.");
    }

    await transporter.verify();
    console.log("Transporter Connected Successfully");

    console.log("Connected to the database successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();

export default app;
