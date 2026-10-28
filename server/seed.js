import { getDb, generateRegistrationId, generateReferralCode } from './db.js';

// Fictional names for demo data
const DEMO_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Sneha Reddy', 'Vikram Singh',
  'Ananya Krishnan', 'Arjun Mehta', 'Diya Nair', 'Karthik Iyer', 'Meera Joshi',
  'Nikhil Verma', 'Pooja Banerjee', 'Rahul Deshmukh', 'Sanya Kapoor', 'Tarun Bhat',
  'Ishita Choudhury', 'Aditya Rao', 'Kavya Menon', 'Siddharth Pillai', 'Riya Agarwal',
  'Harsh Pandey', 'Neha Saxena', 'Pranav Kulkarni', 'Shruti Mishra', 'Varun Malhotra',
  'Divya Srinivasan', 'Manish Tiwari', 'Nisha Chauhan', 'Raj Khurana', 'Swati Dubey',
  'Ankur Jha', 'Pallavi Bhatt', 'Gautam Nanda', 'Deepika Rajan', 'Sameer Ghosh',
  'Tanvi Parekh', 'Kunal Thakur', 'Aditi Sethi', 'Vishal Mohan', 'Ritika Ahuja',
  'Suresh Kumar', 'Bhavna Goel', 'Ashwin Hegde', 'Jyoti Rawat', 'Mohit Arora',
];

const COLLEGES = [
  'IIT Hyderabad', 'NIT Warangal', 'BITS Pilani', 'VIT Vellore',
  'SRM University', 'IIIT Hyderabad', 'PES University', 'RV College of Engineering',
  'CBIT Hyderabad', 'Manipal Institute of Technology', 'NITK Surathkal',
  'BMS College of Engineering', 'Amrita Vishwa Vidyapeetham', 'Thapar University',
  'DTU Delhi', 'NSIT Delhi', 'VJTI Mumbai', 'College of Engineering Pune',
];

const BRANCHES = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'AI & Machine Learning',
  'Data Science', 'Computer Science (AI)', 'Software Engineering',
];

const SOURCES = [
  { source: 'whatsapp', weight: 36 },
  { source: 'class_representative', weight: 24 },
  { source: 'tech_club', weight: 18 },
  { source: 'referral', weight: 14 },
  { source: 'organic', weight: 8 },
];

function weightedRandom(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.source;
  }
  return items[items.length - 1].source;
}

function randomDate(daysBack) {
  const now = new Date();
  const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (now.getTime() - start.getTime()));
}

export function seedDemoData(count = 45) {
  const db = getDb();

  // Clear existing demo data
  db.prepare('DELETE FROM registrations WHERE is_demo = 1').run();
  db.prepare('DELETE FROM referral_clicks WHERE is_demo = 1').run();

  const insert = db.prepare(`
    INSERT INTO registrations (registration_id, full_name, email, email_normalized, college, graduation_year, branch, referral_code_used, acquisition_source, utm_source, own_referral_code, is_demo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const insertClick = db.prepare(`
    INSERT INTO referral_clicks (referral_code, clicked_at, is_demo)
    VALUES (?, ?, 1)
  `);

  const registrations = [];

  const insertAll = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const name = DEMO_NAMES[i % DEMO_NAMES.length];
      const namePart = name.toLowerCase().replace(/\s+/g, '.') + (i >= DEMO_NAMES.length ? i : '');
      const email = `${namePart}@example.com`;
      const emailNormalized = email.toLowerCase().trim();
      const college = COLLEGES[Math.floor(Math.random() * COLLEGES.length)];
      const gradYear = Math.random() > 0.3 ? 2027 : 2026;
      const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)];
      const source = weightedRandom(SOURCES);
      const date = randomDate(7);
      const regId = generateRegistrationId();
      const refCode = generateReferralCode(name);

      // For referral source, link to a previous registration's referral code
      let referralUsed = null;
      if (source === 'referral' && registrations.length > 0) {
        const referrer = registrations[Math.floor(Math.random() * registrations.length)];
        referralUsed = referrer.refCode;
      }

      const utmSource = source === 'whatsapp' ? 'whatsapp' :
        source === 'organic' ? 'organic' :
          source === 'tech_club' ? 'techclub' : null;

      insert.run(
        regId, name, email, emailNormalized, college, gradYear, branch,
        referralUsed, source, utmSource, refCode,
        date.toISOString().replace('T', ' ').substring(0, 19)
      );

      registrations.push({ regId, refCode, date });
    }

    // Add referral clicks for demo data
    for (const reg of registrations) {
      const clicks = Math.floor(Math.random() * 5) + 1;
      for (let c = 0; c < clicks; c++) {
        const clickDate = new Date(reg.date.getTime() - Math.random() * 48 * 60 * 60 * 1000);
        insertClick.run(
          reg.refCode,
          clickDate.toISOString().replace('T', ' ').substring(0, 19)
        );
      }
    }
  });

  insertAll();
  db.close();
  return count;
}

export function clearDemoData() {
  const db = getDb();
  db.prepare('DELETE FROM registrations WHERE is_demo = 1').run();
  db.prepare('DELETE FROM referral_clicks WHERE is_demo = 1').run();
  db.close();
}
