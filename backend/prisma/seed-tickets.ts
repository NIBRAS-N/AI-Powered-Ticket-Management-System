import prisma from "../src/utils/prisma.js";

const senders = [
  { name: "Sarah Johnson", email: "sarah.johnson@university.edu" },
  { name: "Marcus Chen", email: "marcus.chen@gmail.com" },
  { name: "Emily Rodriguez", email: "emily.r@outlook.com" },
  { name: "James Okafor", email: "j.okafor@company.org" },
  { name: "Priya Patel", email: "priya.patel@hotmail.com" },
  { name: "David Kim", email: "david.kim@student.edu" },
  { name: "Anna Müller", email: "anna.mueller@web.de" },
  { name: "Carlos Silva", email: "carlos.silva@email.com" },
  { name: "Fatima Al-Hassan", email: "fatima.h@protonmail.com" },
  { name: "Ryan O'Brien", email: "ryan.obrien@icloud.com" },
  { name: "Yuki Tanaka", email: "yuki.tanaka@mail.jp" },
  { name: "Olivia Brown", email: "olivia.b@yahoo.com" },
  { name: "Mohammed Ali", email: "m.ali@university.edu" },
  { name: "Laura Rossi", email: "laura.rossi@gmail.com" },
  { name: "Kevin Nguyen", email: "kevin.nguyen@outlook.com" },
];

const tickets: {
  subject: string;
  description: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  category: "GENERAL" | "TECHNICAL" | "REFUND" | null;
}[] = [
  // OPEN + TECHNICAL (20)
  { subject: "Cannot access course videos after payment", description: "I paid for the Advanced Python course yesterday but all video lectures show a lock icon. My order number is #ORD-4521. I've tried logging out and back in but the issue persists.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Mobile app crashes on Android 14", description: "The app crashes immediately after opening on my Samsung Galaxy S24. I've reinstalled it twice and cleared cache. Running Android 14 with latest updates.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Two-factor authentication not sending codes", description: "I enabled 2FA last week and now I'm not receiving SMS verification codes. I've checked my phone number is correct. This is blocking me from logging in.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Video playback buffering constantly", description: "All course videos buffer every 10-15 seconds despite having 100Mbps internet. Tested on Chrome and Firefox, same issue. Other streaming sites work fine.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Certificate download returns 404 error", description: "I completed the Data Science Fundamentals course and got the congratulations screen, but clicking 'Download Certificate' gives a 404 Not Found error. Course shows 100% complete.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Search function returning irrelevant results", description: "When I search for 'machine learning' in the course catalog, I get cooking courses and language classes. The search seems completely broken.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Assignment upload failing with timeout", description: "I've been trying to upload my project submission (15MB PDF) for the past 2 hours. It gets to 90% and then times out every time. Deadline is tomorrow.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Dark mode toggle not persisting", description: "Every time I refresh the page, dark mode resets to light mode. I've tried different browsers and the setting never saves. Minor but annoying issue.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Quiz timer running in background", description: "During the midterm quiz, I switched tabs briefly and the timer kept running. Lost 5 minutes. Is there a way to pause or get extra time?", status: "OPEN", category: "TECHNICAL" },
  { subject: "API documentation page showing outdated endpoints", description: "The REST API docs at /api/docs still show v1 endpoints but I'm on v2. Several endpoints return 404 when I try the documented URLs.", status: "OPEN", category: "TECHNICAL" },
  { subject: "SSO login loop with Google account", description: "Clicking 'Sign in with Google' redirects me back to the login page in an infinite loop. Works fine with email/password login.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Dashboard widgets not loading data", description: "My student dashboard shows 'Loading...' spinners on all widgets for the past 3 days. Progress tracking, upcoming deadlines, and announcements all blank.", status: "OPEN", category: "TECHNICAL" },

  // OPEN + GENERAL (10)
  { subject: "How do I change my enrolled course section?", description: "I accidentally enrolled in Section B of Introduction to Statistics but I need Section A because of schedule conflicts. Can this be switched?", status: "OPEN", category: "GENERAL" },
  { subject: "Request for group discount on team enrollment", description: "Our company wants to enroll 25 employees in the Project Management certification. Do you offer group or corporate discounts?", status: "OPEN", category: "GENERAL" },
  { subject: "Can I get a letter of enrollment for my visa application?", description: "I need an official letter confirming my enrollment in the Full-Stack Development program for my student visa application. Is this possible?", status: "OPEN", category: "GENERAL" },
  { subject: "Course material accessibility for visually impaired student", description: "I'm a visually impaired student using JAWS screen reader. Several course PDFs are image-based and not accessible. Can you provide text alternatives?", status: "OPEN", category: "GENERAL" },
  { subject: "Inquiry about instructor-led vs self-paced options", description: "I'm considering the Cloud Architecture course. What's the difference between the instructor-led and self-paced versions? Is the certification the same?", status: "OPEN", category: "GENERAL" },
  { subject: "How to transfer course credits to my university", description: "I completed your Cybersecurity Essentials course. My university said they might accept transfer credits. Do you have a process for this?", status: "OPEN", category: "GENERAL" },
  { subject: "Need extension on assignment deadline", description: "I had a family emergency this week and couldn't complete the Week 3 assignment for Database Design. Can I get a 5-day extension?", status: "OPEN", category: "GENERAL" },
  { subject: "Bulk enrollment CSV upload not documented", description: "Our HR team needs to upload a CSV of 50 employees for enrollment. I can't find any documentation on the required format or upload process.", status: "OPEN", category: "GENERAL" },

  // OPEN + REFUND (8)
  { subject: "Refund request - course content outdated", description: "The 'React Native 2024' course still teaches class components and React Native 0.68. The content is severely outdated. I'd like a full refund please.", status: "OPEN", category: "REFUND" },
  { subject: "Double charged for annual subscription", description: "My credit card was charged twice ($299 each) on June 1st for the annual Pro subscription. Transaction IDs: TXN-8832 and TXN-8833. Please refund the duplicate.", status: "OPEN", category: "REFUND" },
  { subject: "Refund for course I never started", description: "I purchased the UX Design Bootcamp on May 28 but haven't accessed any content yet. Life circumstances changed and I need a full refund.", status: "OPEN", category: "REFUND" },
  { subject: "Partial refund request - dropped out mid-course", description: "I completed only 20% of the Machine Learning Specialization before realizing it's too advanced for me. Can I get a partial refund for the remaining content?", status: "OPEN", category: "REFUND" },
  { subject: "Charged after cancelling free trial", description: "I cancelled my free trial on May 15 (have confirmation email) but was charged $49.99 on May 20. Please reverse this charge.", status: "OPEN", category: "REFUND" },

  // OPEN + null category (5)
  { subject: "General feedback on platform experience", description: "Just wanted to share that the new redesign looks great but the navigation is confusing. Had trouble finding my enrolled courses after the update.", status: "OPEN", category: null },
  { subject: "Question about your company's hiring process", description: "I'm a recent graduate interested in joining your content team. I couldn't find career information on your website. Where can I apply?", status: "OPEN", category: null },
  { subject: "Partnership inquiry from educational publisher", description: "We're Pearson Education and interested in licensing some of your course content for our digital textbook platform. Who should I contact?", status: "OPEN", category: null },
  { subject: "Suggestion: Add Korean language support", description: "Many of my colleagues in Seoul would love to use your platform but the lack of Korean language support is a barrier. Any plans to add it?", status: "OPEN", category: null },
  { subject: "Received someone else's completion email", description: "I got a course completion email for 'Advanced SQL' which I've never enrolled in. The email was addressed to a different name. Might be a data issue.", status: "OPEN", category: null },

  // RESOLVED + TECHNICAL (12)
  { subject: "Password reset link expired before I could use it", description: "The password reset email took 4 hours to arrive and the link had already expired by then. Tried 3 times.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Progress bar stuck at 85% despite completing all modules", description: "I've watched every video and completed every quiz in the JavaScript Fundamentals course but progress shows 85%. Missing module tracking?", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Keyboard shortcuts not working in code editor", description: "The in-browser code editor doesn't respond to Ctrl+S, Ctrl+Z, or any standard shortcuts. Have to use mouse for everything.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Email notifications coming in wrong timezone", description: "All my email reminders show EST times but I'm in PST. My profile timezone is set correctly to Pacific Time.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Broken link in Week 5 reading materials", description: "The link to the 'Advanced Algorithms Paper' in CS301 Week 5 returns a 404. Other students in the forum confirmed the same issue.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Cannot resize video player on Firefox", description: "The video player is fixed to a small size on Firefox 122. It works fine on Chrome. Theater mode button doesn't respond.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Exported data missing from CSV download", description: "When I export my grades as CSV, the file only contains headers with no data rows. Tried multiple times and same result.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Audio out of sync with video in recorded lectures", description: "Lectures for BIO201 have audio that's about 3 seconds ahead of the video. Makes it really hard to follow along with slides.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Login session expires every 10 minutes", description: "I keep getting logged out every 10 minutes even though I'm actively using the platform. Very disruptive during timed quizzes.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Drag and drop quiz type not working on iPad", description: "The drag and drop questions in the UI/UX course quiz don't work on my iPad Pro with Safari. Touch events seem broken.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Webhook integration failing for Slack notifications", description: "Set up the Slack integration for course announcements but webhooks return 500 errors. Tested the webhook URL independently and it works.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Subtitles showing wrong language on course videos", description: "I selected English subtitles but getting Spanish captions on all videos in the Marketing Analytics course.", status: "RESOLVED", category: "TECHNICAL" },

  // RESOLVED + GENERAL (8)
  { subject: "Need invoice for tax deduction purposes", description: "I need a formal invoice for my annual subscription payment of $299 for tax purposes. My company reimburses education expenses.", status: "RESOLVED", category: "GENERAL" },
  { subject: "How to change my display name", description: "I changed my legal name recently and need to update it on the platform. Can't find where to change it in settings.", status: "RESOLVED", category: "GENERAL" },
  { subject: "Question about course prerequisite requirements", description: "I want to take the Advanced Kubernetes course but the prerequisite says 'Docker Essentials'. I have professional Docker experience but didn't take your course. Can I skip it?", status: "RESOLVED", category: "GENERAL" },
  { subject: "Certificate has wrong completion date", description: "My Data Analytics certificate shows May 10 but I actually completed it on May 3. Can this be corrected?", status: "RESOLVED", category: "GENERAL" },
  { subject: "Request to merge two accounts", description: "I accidentally created two accounts - one with my personal email and one with my work email. Can these be merged? I have purchases on both.", status: "RESOLVED", category: "GENERAL" },
  { subject: "Inquiry about student discount eligibility", description: "I'm a part-time graduate student. The student discount page says 'full-time students only'. Does part-time qualify for any discount?", status: "RESOLVED", category: "GENERAL" },
  { subject: "Need course syllabus for employer approval", description: "My employer needs to review the course syllabus before approving tuition reimbursement for the AWS Solutions Architect prep course.", status: "RESOLVED", category: "GENERAL" },
  { subject: "Changing payment method for subscription", description: "My credit card on file expired. How do I update my payment method before the next billing cycle on July 1?", status: "RESOLVED", category: "GENERAL" },

  // RESOLVED + REFUND (5)
  { subject: "Refund request - purchased wrong course level", description: "I bought Advanced Python but I'm a beginner. Meant to buy Python for Beginners. Can I get a refund and purchase the correct one?", status: "RESOLVED", category: "REFUND" },
  { subject: "Subscription auto-renewed without warning", description: "I wasn't notified before my annual subscription auto-renewed. I would have cancelled. Please refund the renewal charge.", status: "RESOLVED", category: "REFUND" },
  { subject: "Promotional price not applied at checkout", description: "I used code SUMMER30 for 30% off but was charged full price $199 instead of $139.30. Have screenshot of the promo page.", status: "RESOLVED", category: "REFUND" },
  { subject: "Refund for duplicate course purchase", description: "I accidentally purchased the same course (Web Development Bootcamp) twice because the first transaction appeared to fail. Need refund on the duplicate.", status: "RESOLVED", category: "REFUND" },
  { subject: "Course removed from catalog before completion", description: "The 'Blockchain Fundamentals' course was removed from the platform while I was halfway through. I paid $149 and never got to finish.", status: "RESOLVED", category: "REFUND" },

  // CLOSED + TECHNICAL (5)
  { subject: "Cannot connect to live coding lab environment", description: "The cloud lab environment shows 'Connection refused' when I try to launch it. Been like this for 2 weeks. Using Chrome on Windows 11.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Forum posts disappearing after submission", description: "My discussion forum posts in CS101 disappear after I submit them. Other students can't see them either. Posted 5 times with no success.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Calendar sync not working with Outlook", description: "The iCal feed for course deadlines isn't syncing with my Outlook calendar. Works fine with Google Calendar though.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Print function cuts off right side of page", description: "When printing course notes, the right 20% of each page is cut off. Tried adjusting margins and landscape mode. Chrome and Edge both affected.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Accessibility issue: color contrast on quiz answers", description: "The green/red colors used for correct/incorrect quiz answers are indistinguishable for colorblind users. I have deuteranopia.", status: "CLOSED", category: "TECHNICAL" },

  // CLOSED + GENERAL (5)
  { subject: "Account deletion request", description: "I'd like to permanently delete my account and all associated data per GDPR Article 17. My user ID is USR-29381.", status: "CLOSED", category: "GENERAL" },
  { subject: "Complaint about instructor behavior in live session", description: "During the live Q&A on June 5th, the instructor was dismissive of student questions and made inappropriate comments. I have screenshots.", status: "CLOSED", category: "GENERAL" },
  { subject: "Request for academic accommodation documentation", description: "I need documentation of my extended deadline accommodations for my university's disability services office.", status: "CLOSED", category: "GENERAL" },
  { subject: "Incorrect information in course description", description: "The DevOps course page says 'includes AWS certification exam voucher' but after purchasing, I was told this is no longer included.", status: "CLOSED", category: "GENERAL" },
  { subject: "Withdrawal from course mid-semester", description: "Due to medical reasons, I need to formally withdraw from all three enrolled courses. Attached is my doctor's note.", status: "CLOSED", category: "GENERAL" },

  // CLOSED + REFUND (5)
  { subject: "Chargeback filed - no response to refund request", description: "I submitted a refund request 45 days ago with no response. I've now filed a chargeback with my bank. Case #CB-90123.", status: "CLOSED", category: "REFUND" },
  { subject: "Refund denied unfairly - want to escalate", description: "My refund was denied because I 'accessed content' but I only watched the intro video. I want to escalate this to a manager.", status: "CLOSED", category: "REFUND" },
  { subject: "Requesting refund for gifted course recipient declined", description: "I bought a course as a gift. The recipient doesn't want it but you're saying only the recipient can request the refund. This doesn't make sense.", status: "CLOSED", category: "REFUND" },
  { subject: "Currency conversion resulted in overcharge", description: "Course listed at $99 USD but I was charged €105 instead of ~€91 at current exchange rates. The conversion markup seems excessive.", status: "CLOSED", category: "REFUND" },
  { subject: "Trial period refund - was not clearly stated", description: "The 7-day trial terms were buried in the footer. I assumed it was a 30-day trial like most services. Want a refund of the $49.99 charge.", status: "CLOSED", category: "REFUND" },

  // Additional OPEN tickets (10)
  { subject: "Microphone not detected in live classroom", description: "During live sessions, the platform doesn't detect my USB microphone even though it works in Zoom and Google Meet. Using Chrome on Mac.", status: "OPEN", category: "TECHNICAL" },
  { subject: "Batch enrollment failing for our department", description: "I'm trying to enroll 15 students from the Engineering department using the admin panel but it fails silently after processing 3 records.", status: "OPEN", category: "TECHNICAL" },
  { subject: "How to get CPE credits for completed courses?", description: "I'm a CPA and need to submit continuing professional education credits. Which of your finance courses qualify and how do I get documentation?", status: "OPEN", category: "GENERAL" },
  { subject: "Want to gift a course subscription to my team", description: "I want to buy 10 gift subscriptions for my engineering team for Christmas. Is there a bulk gifting option with custom delivery dates?", status: "OPEN", category: "GENERAL" },
  { subject: "Refund for course that changed instructors", description: "I enrolled specifically because of the instructor listed. They were replaced mid-course and the teaching quality dropped significantly.", status: "OPEN", category: "REFUND" },
  { subject: "Overcharged on monthly plan vs annual rate", description: "I was paying $29/month for 14 months ($406 total) when the annual plan is $299. Can I get the difference refunded?", status: "OPEN", category: "REFUND" },
  { subject: "Platform doesn't comply with our company firewall", description: "Our corporate firewall blocks several CDN domains your platform uses. Can you provide a list of domains we need to whitelist?", status: "OPEN", category: "TECHNICAL" },
  { subject: "Requesting transcript of all completed courses", description: "I need an official transcript showing all courses completed with grades for a job application. How can I obtain this?", status: "OPEN", category: "GENERAL" },
  { subject: "Wrong answer marked as correct in quiz", description: "Question 7 in the Networking Basics Week 2 quiz marks '255.255.255.0' as incorrect for a /24 subnet mask question. This is definitely correct.", status: "OPEN", category: null },
  { subject: "Feature request: offline mode for mobile app", description: "I commute on the subway with no signal. Would be amazing to download lectures for offline viewing like Netflix does.", status: "OPEN", category: null },

  // Additional RESOLVED tickets (10)
  { subject: "Grade not updating after retaking exam", description: "I retook the final exam for Statistics 101 and scored 92% but my grade still shows the original 67%. The retake policy says highest grade counts.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Peer review assignment matched with myself", description: "The peer review system for the Creative Writing course assigned me to review my own submission. Other students report the same issue.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Can I switch from monthly to annual billing?", description: "I've been on the monthly plan for 6 months now. If I switch to annual, will I get credit for this month's payment?", status: "RESOLVED", category: "GENERAL" },
  { subject: "Need W-9 form for instructor payment", description: "I'm an instructor on your platform and need the W-9 form for tax filing. Where can I download it or who do I contact?", status: "RESOLVED", category: "GENERAL" },
  { subject: "Refund for accidental annual upgrade", description: "I meant to click 'Learn More' about the annual plan but it charged me immediately. No confirmation dialog was shown.", status: "RESOLVED", category: "REFUND" },
  { subject: "Pro features not unlocked after upgrade", description: "I upgraded to Pro 2 hours ago and payment went through but I still can't access code reviews, priority support, or the Pro courses.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Notification preferences resetting weekly", description: "I turn off email notifications for marketing but they re-enable themselves every Monday. Very frustrating spam issue.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "Course completion percentage differs across devices", description: "My laptop shows 72% completion for React Advanced but my phone shows 65%. Seems like progress isn't syncing properly.", status: "RESOLVED", category: "TECHNICAL" },
  { subject: "How do I become a course instructor?", description: "I'm a senior developer with 10 years experience and want to create courses on your platform. What's the application process?", status: "RESOLVED", category: "GENERAL" },
  { subject: "Refund for service outage during exam period", description: "The platform was down for 6 hours during our exam window last Saturday. 200 students were affected. We need a refund or credit.", status: "RESOLVED", category: "REFUND" },

  // Additional CLOSED tickets (10)
  { subject: "DMCA takedown notice for course content", description: "We've identified that Module 3 of your 'Web Scraping with Python' course uses our copyrighted code examples without permission. Formal DMCA notice attached.", status: "CLOSED", category: "GENERAL" },
  { subject: "Student harassment in discussion forum", description: "User 'techguru99' has been posting hostile and threatening messages in the Data Science forum. Screenshots attached. Other students have also complained.", status: "CLOSED", category: "GENERAL" },
  { subject: "Memory leak in interactive coding exercises", description: "The browser tab memory usage grows from 200MB to 4GB after running 5-6 coding exercises. Eventually crashes the tab. Reproduced on Chrome and Firefox.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Webhook endpoint returning stale data", description: "Our LMS integration webhook receives course completion events but the grade data is always from the previous attempt, not the latest.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Refund request denied - disputing decision", description: "My refund was denied because I'm past the 30-day window, but I reported the issue within 30 days and only got a response after 45 days.", status: "CLOSED", category: "REFUND" },
  { subject: "Course bundle pricing error at checkout", description: "The Data Science bundle shows $399 on the catalog page but charges $499 at checkout. False advertising. Want the advertised price or a refund.", status: "CLOSED", category: "REFUND" },
  { subject: "Unable to delete uploaded personal documents", description: "I accidentally uploaded my passport scan instead of my assignment. The delete button doesn't work and I need this removed for privacy reasons.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Third-party integration leaking email addresses", description: "After connecting the Slack integration, my email was added to marketing lists from third-party companies. This is a privacy violation.", status: "CLOSED", category: "TECHNICAL" },
  { subject: "Annual report request for institutional account", description: "As the account administrator for State University, I need the annual usage report for our 500-seat institutional license for the board meeting.", status: "CLOSED", category: "GENERAL" },
  { subject: "Platform terms of service questions", description: "Our legal team has questions about clauses 4.2 and 7.1 in your Terms of Service regarding data ownership of student-generated content.", status: "CLOSED", category: null },
];

async function main() {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", isActive: true },
    select: { id: true },
  });

  const agentIds = agents.map((a) => a.id);
  const now = Date.now();

  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const sender = senders[i % senders.length];
    const createdAt = new Date(now - (tickets.length - i) * 3600 * 1000 * Math.random() * 8);

    const assigneeId =
      t.status === "OPEN" && Math.random() < 0.4
        ? null
        : agentIds.length > 0
          ? agentIds[i % agentIds.length]
          : null;

    await prisma.ticket.create({
      data: {
        subject: t.subject,
        description: t.description,
        senderEmail: sender.email,
        senderName: sender.name,
        status: t.status,
        category: t.category,
        assigneeId,
        createdAt,
        messages: {
          create: {
            senderType: "STUDENT",
            senderName: sender.name,
            content: t.description,
            createdAt,
          },
        },
      },
    });
  }

  console.log(`Seeded ${tickets.length} tickets`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
