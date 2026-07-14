import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { SavedEvent } from "../models/SavedEvent";
import { Attendance } from "../models/Attendance";
import { Review } from "../models/Review";
import { Payment } from "../models/Payment";

const images = {
  next: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
  ai: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
  mongo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
  ui: "https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1200&auto=format&fit=crop",
  career: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1200&auto=format&fit=crop",
  charts: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
  tailwind: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?q=80&w=1200&auto=format&fit=crop",
  startup: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop"
};

const gallery = {
  next: [images.next, images.tailwind, images.mongo],
  ai: [images.ai, images.charts, images.startup],
  mongo: [images.mongo, images.next, images.charts],
  ui: [images.ui, images.tailwind, images.startup],
  career: [images.career, images.startup, images.next],
  charts: [images.charts, images.ai, images.mongo],
  tailwind: [images.tailwind, images.ui, images.next]
};

const userEmail = process.env.SEED_USER_EMAIL || "fahid@example.com";
const userPassword = process.env.SEED_USER_PASSWORD || "TypeScript@123";
const adminEmail = process.env.ADMIN_EMAIL || "admin@eventpilot.dev";
const adminPassword = process.env.ADMIN_PASSWORD || "TypeScript@123";
const demoEmail = process.env.DEMO_USER_EMAIL || "demo@eventpilot.dev";
const demoPasswordValue = process.env.DEMO_USER_PASSWORD || "Demo@123";

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}), Event.deleteMany({}), SavedEvent.deleteMany({}), Attendance.deleteMany({}), Review.deleteMany({}), Payment.deleteMany({})
  ]);

  const password = await bcrypt.hash(userPassword, 12);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const demoPassword = await bcrypt.hash(demoPasswordValue, 12);

  const [fahid, admin, demo] = await User.create([
    { name: "Fahid Hasan", email: userEmail, password, role: "user", membership: "free", photoUrl: "" },
    { name: "EventPilot Admin", email: adminEmail, password: adminPasswordHash, role: "admin", membership: "premium", photoUrl: "" },
    { name: "Demo Visitor", email: demoEmail, password: demoPassword, role: "user", membership: "free", isDemo: true, photoUrl: "" }
  ]);

  const events = await Event.create([
    {
      title: "Next.js TypeScript Bootcamp",
      shortDescription: "Build a full-stack application with Next.js, TypeScript, JWT, and MongoDB.",
      fullDescription: "A hands-on workshop for learners who want to understand modern full-stack development using Next.js, TypeScript, MongoDB, authentication, protected pages, and clean UI architecture.",
      category: "Web Development", location: "Dhaka", date: new Date("2026-07-24"), price: 1500, accessType: "premium", status: "approved", imageUrl: images.next, gallery: gallery.next, rating: 4.9, capacity: 120, organizerId: admin._id, organizerName: "EventPilot Academy", tags: ["Next.js", "TypeScript", "MongoDB"]
    },
    {
      title: "AI Career Summit Bangladesh",
      shortDescription: "A practical summit about AI portfolios, interviews, and industry project planning.",
      fullDescription: "This summit connects learners, mentors, and industry speakers to discuss practical AI career paths, portfolio preparation, responsible AI tools, and project presentation.",
      category: "AI & Data", location: "Chattogram", date: new Date("2026-08-08"), price: 2200, accessType: "premium", status: "approved", imageUrl: images.ai, gallery: gallery.ai, rating: 4.7, capacity: 180, organizerId: admin._id, organizerName: "Data Club BD", tags: ["AI", "Career", "Portfolio"]
    },
    {
      title: "MongoDB API Builder Day",
      shortDescription: "Learn schema design, secure API routes, and backend architecture.",
      fullDescription: "A backend-focused event covering MongoDB schema design, authentication middleware, protected endpoints, aggregation ideas, and deployment-ready API structure.",
      category: "Web Development", location: "Sylhet", date: new Date("2026-08-14"), price: 1200, accessType: "free", status: "approved", imageUrl: images.mongo, gallery: gallery.mongo, rating: 4.8, capacity: 90, organizerId: admin._id, organizerName: "Backend Builders Community", tags: ["MongoDB", "Express", "API"]
    },
    {
      title: "UI/UX Portfolio Review",
      shortDescription: "Design mentors review portfolios and give practical improvement guidance.",
      fullDescription: "A community session where designers and mentors help learners improve case studies, visual hierarchy, accessibility, and presentation confidence.",
      category: "UI/UX Design", location: "Online", date: new Date("2026-08-20"), price: 0, accessType: "free", status: "approved", imageUrl: images.ui, gallery: gallery.ui, rating: 4.6, capacity: 75, organizerId: admin._id, organizerName: "Design Practice Lab", tags: ["UI", "UX", "Portfolio"]
    },
    {
      title: "Frontend Interview Practice Night",
      shortDescription: "Practice React, TypeScript, coding problem solving, and communication.",
      fullDescription: "A friendly interview-practice event where junior developers solve frontend tasks, explain code decisions, and receive feedback from mentors.",
      category: "Career", location: "Dhaka", date: new Date("2026-09-03"), price: 800, accessType: "free", status: "approved", imageUrl: images.career, gallery: gallery.career, rating: 4.5, capacity: 60, organizerId: admin._id, organizerName: "Career Sprint BD", tags: ["Interview", "React", "Career"]
    },
    {
      title: "Data Visualization with Recharts",
      shortDescription: "Build beautiful charts and dashboards using React and Recharts.",
      fullDescription: "A practical online event about building dashboard charts, preparing frontend-friendly data, and explaining metrics clearly to users.",
      category: "AI & Data", location: "Online", date: new Date("2026-09-09"), price: 900, accessType: "premium", status: "approved", imageUrl: images.charts, gallery: gallery.charts, rating: 4.7, capacity: 100, organizerId: admin._id, organizerName: "Analytics School Online", tags: ["Recharts", "Data", "Dashboard"]
    },
    {
      title: "Advanced React Patterns Day",
      shortDescription: "A practical workshop for improving React code quality and component design.",
      fullDescription: "This pending organizer submission teaches reusable component design, custom hooks, render patterns, and better state organization for professional React applications.",
      category: "Web Development", location: "Dhaka", date: new Date("2026-10-05"), price: 1800, accessType: "premium", status: "pending", imageUrl: images.tailwind, gallery: gallery.tailwind, rating: 4.6, capacity: 100, organizerId: admin._id, organizerName: "React Practice Lab", tags: ["React", "Patterns", "Professional"]
    }
  ]);

  await SavedEvent.create({ userId: fahid._id, eventId: events[1]._id });
  await Attendance.create({ userId: fahid._id, eventId: events[2]._id, status: "confirmed" });
  await Review.create({ userId: fahid._id, rating: 5, comment: "EventPilot helped me find relevant tech events and track them inside a clean dashboard." });

  console.log("Seed completed");
  console.log(`User: ${userEmail}`);
  console.log(`Admin: ${adminEmail}`);
  console.log(`Demo: ${demoEmail}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
