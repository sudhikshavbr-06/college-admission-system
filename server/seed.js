import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Application from './models/Application.js';
import Payment from './models/Payment.js';
import Cutoff from './models/Cutoff.js';
import Scholarship from './models/Scholarship.js';
import Notification from './models/Notification.js';

const YEAR = 2026;

const sem = (n, subjects) => ({ semester: n, subjects: subjects.map(([code, name, credits]) => ({ code, name, credits })) });

const btechCore = (prefix, sets) => sets.map((s, i) => sem(i + 1, s.map(([code, name, credits]) => [`${prefix}${code}`, name, credits])));

const cseCurriculum = btechCore('CS', [
  [['101', 'Matrices & Calculus', 4], ['102', 'Physics for Computing', 3], ['103', 'Programming in C', 4], ['104', 'Digital Logic Design', 3], ['105', 'Technical English', 2], ['106', 'Engineering Graphics Lab', 2]],
  [['201', 'Statistics & Probability', 4], ['202', 'Data Structures', 4], ['203', 'Object Oriented Programming with C++', 4], ['204', 'Computer Architecture', 3], ['205', 'Environmental Science', 2], ['206', 'Data Structures Lab', 2]],
  [['301', 'Discrete Mathematics', 4], ['302', 'Design & Analysis of Algorithms', 4], ['303', 'Operating Systems', 4], ['304', 'Database Management Systems', 4], ['305', 'Software Engineering', 3], ['306', 'DBMS Lab', 2]],
  [['401', 'Computer Networks', 4], ['402', 'Theory of Computation', 3], ['403', 'Microprocessors & Microcontrollers', 3], ['404', 'Java Programming', 4], ['405', 'Universal Human Values', 2], ['406', 'Networks Lab', 2]],
  [['501', 'Machine Learning Foundations', 4], ['502', 'Compiler Design', 4], ['503', 'Full Stack Web Development', 4], ['504', 'Cloud Computing', 3], ['505', 'Professional Elective I', 3], ['506', 'ML & Web Lab', 2]],
  [['601', 'Deep Learning', 4], ['602', 'Cryptography & Network Security', 3], ['603', 'Mobile Application Development', 3], ['604', 'Professional Elective II', 3], ['605', 'Open Elective I', 3], ['606', 'Mini Project', 2]],
  [['701', 'Big Data Analytics', 3], ['702', 'DevOps & Containerization', 3], ['703', 'Professional Elective III', 3], ['704', 'Open Elective II', 3], ['705', 'Internship / Industry Training', 4]],
  [['801', 'Project Work Phase II', 10], ['802', 'Professional Ethics', 2], ['803', 'Seminar on Emerging Technologies', 2]],
]);

const aidsCurriculum = btechCore('AD', [
  [['101', 'Linear Algebra & Optimization', 4], ['102', 'Python Programming', 4], ['103', 'Digital Fundamentals', 3], ['104', 'Data Science Essentials', 3], ['105', 'Communicative English', 2], ['106', 'Python Lab', 2]],
  [['201', 'Probability & Random Processes', 4], ['202', 'Data Structures with Python', 4], ['203', 'Computer Organization', 3], ['204', 'Exploratory Data Analysis', 3], ['205', 'Essence of Indian Knowledge Systems', 2], ['206', 'Data Analysis Lab', 2]],
  [['301', 'Statistical Inference', 4], ['302', 'Machine Learning', 4], ['303', 'Database Systems', 4], ['304', 'Data Visualization', 3], ['305', 'Operating Systems', 3], ['306', 'ML Lab', 2]],
  [['401', 'Deep Learning', 4], ['402', 'Big Data Technologies', 3], ['403', 'Natural Language Processing', 4], ['404', 'Computer Vision', 4], ['405', 'Professional Elective I', 3], ['406', 'DL & CV Lab', 2]],
  [['501', 'Reinforcement Learning', 3], ['502', 'Time Series & Forecasting', 3], ['503', 'MLOps & Model Deployment', 3], ['504', 'Professional Elective II', 3], ['505', 'Open Elective I', 3], ['506', 'Capstone Phase I', 2]],
  [['601', 'Generative AI & LLMs', 4], ['602', 'AI Ethics & Governance', 2], ['603', 'Professional Elective III', 3], ['604', 'Internship', 4], ['605', 'Capstone Phase II', 4]],
]);

const eceCurriculum = btechCore('EC', [
  [['101', 'Semiconductor Physics', 4], ['102', 'Circuit Theory', 4], ['103', 'Programming in C', 3], ['104', 'Engineering Mathematics I', 4], ['105', 'Basic Electrical Engineering Lab', 2], ['106', 'Technical English', 2]],
  [['201', 'Electronic Devices & Circuits', 4], ['202', 'Signals & Systems', 4], ['203', 'Engineering Mathematics II', 4], ['204', 'Digital Electronics', 3], ['205', 'EDC Lab', 2], ['206', 'Environmental Science', 2]],
  [['301', 'Analog Integrated Circuits', 4], ['302', 'Electromagnetic Fields', 3], ['303', 'Digital Signal Processing', 4], ['304', 'Communication Theory', 4], ['305', 'Circuits & Measurement Lab', 2], ['306', 'Universal Human Values', 2]],
  [['401', 'Microprocessors & Microcontrollers', 4], ['402', 'Digital Communication', 4], ['403', 'Antennas & Wave Propagation', 3], ['404', 'VLSI Design', 4], ['405', 'Embedded Systems Lab', 2], ['406', 'Professional Elective I', 3]],
  [['501', 'Wireless Communication', 3], ['502', 'IoT & Sensor Networks', 4], ['503', 'CMOS Digital IC Design', 3], ['504', 'Professional Elective II', 3], ['505', 'Open Elective I', 3], ['506', 'VLSI Lab', 2]],
  [['601', '5G & Optical Networks', 3], ['602', 'Robotics & Automation', 3], ['603', 'Professional Elective III', 3], ['604', 'Industry Internship', 4], ['605', 'Project Work', 4]],
]);

const mechCurriculum = btechCore('ME', [
  [['101', 'Engineering Mechanics', 4], ['102', 'Engineering Graphics', 3], ['103', 'Engineering Mathematics I', 4], ['104', 'Manufacturing Technology I', 3], ['105', 'Workshop Practice Lab', 2], ['106', 'Technical English', 2]],
  [['201', 'Thermodynamics', 4], ['202', 'Fluid Mechanics', 4], ['203', 'Strength of Materials', 4], ['204', 'Engineering Mathematics II', 4], ['205', 'Fluid Mechanics Lab', 2], ['206', 'Environmental Science', 2]],
  [['301', 'Manufacturing Technology II', 4], ['302', 'Kinematics of Machinery', 4], ['303', 'Dynamics of Machinery', 4], ['304', 'Thermal Engineering', 3], ['305', 'Metrology & Measurements Lab', 2], ['306', 'Universal Human Values', 2]],
  [['401', 'Design of Machine Elements', 4], ['402', 'Heat & Mass Transfer', 4], ['403', 'CAD/CAM', 4], ['404', 'IC Engines', 3], ['405', 'Thermal Engineering Lab', 2], ['406', 'Professional Elective I', 3]],
  [['501', 'Refrigeration & Air Conditioning', 3], ['502', 'Finite Element Analysis', 3], ['503', 'Industrial Robotics', 3], ['504', 'Professional Elective II', 3], ['505', 'Open Elective I', 3], ['506', 'CAD/CAM Lab', 2]],
  [['601', 'Operations Research', 3], ['602', 'Additive Manufacturing', 3], ['603', 'Professional Elective III', 3], ['604', 'Industry Internship', 4], ['605', 'Project Work', 4]],
]);

const bbaCurriculum = [
  sem(1, [['BBA101', 'Principles of Management', 4], ['BBA102', 'Financial Accounting', 4], ['BBA103', 'Business Economics', 3], ['BBA104', 'Business Communication', 3], ['BBA105', 'Quantitative Methods for Business', 3]]),
  sem(2, [['BBA201', 'Organizational Behaviour', 4], ['BBA202', 'Cost & Management Accounting', 4], ['BBA203', 'Marketing Management', 3], ['BBA204', 'Business Law', 3], ['BBA205', 'Computer Applications in Business', 3]]),
  sem(3, [['BBA301', 'Human Resource Management', 3], ['BBA302', 'Operations Management', 3], ['BBA303', 'Corporate Finance', 4], ['BBA304', 'Business Statistics & Analytics', 3], ['BBA305', 'Entrepreneurship Development', 3]]),
  sem(4, [['BBA401', 'Consumer Behaviour', 3], ['BBA402', 'Banking & Insurance', 3], ['BBA403', 'Management Information Systems', 3], ['BBA404', 'Digital Marketing', 3], ['BBA405', 'Summer Internship', 3]]),
  sem(5, [['BBA501', 'Strategic Management', 4], ['BBA502', 'International Business', 3], ['BBA503', 'Professional Elective I', 3], ['BBA504', 'Open Elective', 3], ['BBA505', 'Business Research Methods', 3]]),
  sem(6, [['BBA601', 'Business Analytics & AI Tools', 3], ['BBA602', 'Professional Elective II', 3], ['BBA603', 'Corporate Governance & Ethics', 2], ['BBA604', 'Capstone Business Project', 6]]),
];

const bscDsCurriculum = [
  sem(1, [['DS101', 'Foundations of Data Science', 4], ['DS102', 'Mathematics for Data Science', 4], ['DS103', 'Python Programming', 4], ['DS104', 'Statistics I', 3], ['DS105', 'Python Lab', 2]]),
  sem(2, [['DS201', 'Statistical Inference', 4], ['DS202', 'Database Systems & SQL', 4], ['DS203', 'Data Structures', 3], ['DS204', 'Data Visualization', 3], ['DS205', 'SQL & Visualization Lab', 2]]),
  sem(3, [['DS301', 'Machine Learning', 4], ['DS302', 'Big Data Ecosystems', 3], ['DS303', 'Experimental Design & A/B Testing', 3], ['DS304', 'Elective I', 3], ['DS305', 'ML Lab', 2]]),
  sem(4, [['DS401', 'Deep Learning Applications', 4], ['DS402', 'Business Intelligence', 3], ['DS403', 'Data Ethics & Privacy', 2], ['DS404', 'Elective II', 3], ['DS405', 'Capstone Project', 4]]),
];

const coursesData = [
  { name: 'Computer Science & Engineering', code: 'CSE', degree: 'B.Tech', department: 'School of Computing', icon: '💻', totalSeats: 120, govtSeats: 72, mgmtSeats: 48, annualFee: 95000, mgmtAnnualFee: 165000, description: 'Systems, algorithms and full-stack engineering with AI electives, an industry internship in the final year and 240+ recruiting partners.', curriculum: cseCurriculum, cutoffBase: { OC: 194, BC: 188, MBC: 182, SC: 172, ST: 165 } },
  { name: 'Artificial Intelligence & Data Science', code: 'AI&DS', degree: 'B.Tech', department: 'School of Computing', icon: '🤖', totalSeats: 60, govtSeats: 36, mgmtSeats: 24, annualFee: 105000, mgmtAnnualFee: 175000, description: 'A future-facing program covering machine learning, deep learning, NLP, generative AI and MLOps with a dedicated GPU lab.', curriculum: aidsCurriculum, cutoffBase: { OC: 192, BC: 186, MBC: 180, SC: 170, ST: 163 } },
  { name: 'Electronics & Communication Engineering', code: 'ECE', degree: 'B.Tech', department: 'School of Electrical Sciences', icon: '📡', totalSeats: 90, govtSeats: 54, mgmtSeats: 36, annualFee: 85000, mgmtAnnualFee: 145000, description: 'From VLSI design to 5G and IoT — build hardware-software systems in our Texas Instruments-aided embedded lab.', curriculum: eceCurriculum, cutoffBase: { OC: 186, BC: 179, MBC: 172, SC: 160, ST: 152 } },
  { name: 'Mechanical Engineering', code: 'MECH', degree: 'B.Tech', department: 'School of Mechanical & Building Sciences', icon: '⚙️', totalSeats: 60, govtSeats: 36, mgmtSeats: 24, annualFee: 75000, mgmtAnnualFee: 125000, description: 'Design, thermal and manufacturing sciences with CAD/CAM, robotics and additive manufacturing facilities.', curriculum: mechCurriculum, cutoffBase: { OC: 176, BC: 168, MBC: 161, SC: 148, ST: 140 } },
  { name: 'Business Administration', code: 'BBA', degree: 'BBA', department: 'VIT Business School', icon: '📈', totalSeats: 60, govtSeats: 36, mgmtSeats: 24, annualFee: 65000, mgmtAnnualFee: 110000, durationYears: 3, description: 'A practice-driven management degree with specializations in analytics, marketing and finance, plus a live consulting capstone.', curriculum: bbaCurriculum, cutoffBase: { OC: 168, BC: 160, MBC: 154, SC: 142, ST: 135 } },
  { name: 'Data Science', code: 'BSc-DS', degree: 'B.Sc', department: 'School of Computing', icon: '📊', totalSeats: 40, govtSeats: 24, mgmtSeats: 16, annualFee: 70000, mgmtAnnualFee: 120000, durationYears: 3, description: 'Statistics-first data science covering SQL, ML, visualization and business intelligence for aspiring analysts.', curriculum: bscDsCurriculum, cutoffBase: { OC: 178, BC: 170, MBC: 164, SC: 150, ST: 143 } },
];

const scholarshipsData = [
  { name: 'Merit Excellence Scholarship', type: 'merit', minPercentage: 90, categories: [], discountPercent: 25, seats: 100, deadline: new Date('2026-12-31'), description: 'For toppers with 90%+ in 12th standard. 25% tuition waiver for all four years, renewable with a CGPA above 8.5.', active: true },
  { name: "STEM Women's Scholarship", type: 'special', minPercentage: 85, categories: [], discountPercent: 30, seats: 50, deadline: new Date('2026-12-15'), description: 'Encouraging women in engineering and technology — 30% tuition waiver plus a paid research internship after 2nd year.', active: true },
  { name: 'Sports Excellence Scholarship', type: 'sports', minPercentage: 70, categories: [], discountPercent: 40, seats: 30, deadline: new Date('2026-11-30'), description: 'For state/national-level athletes. Up to 40% tuition waiver with access to our sports science centre.', active: true },
  { name: 'Need-Based Financial Aid', type: 'need_based', minPercentage: 60, categories: ['SC', 'ST', 'MBC'], discountPercent: 50, seats: 120, deadline: new Date('2026-12-31'), description: 'Half-tuition support for SC/ST/MBC students with family income below ₹4.5 LPA. Includes free hostel for first year.', active: true },
];

const randomOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seed = async () => {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany(),
    Course.deleteMany(),
    Application.deleteMany(),
    Payment.deleteMany(),
    Cutoff.deleteMany(),
    Scholarship.deleteMany(),
    Notification.deleteMany(),
  ]);

  console.log('Seeding users...');
  const admin = await User.create({ name: 'Dr. Anita Deshmukh', email: 'admin@meridian.edu', password: 'Admin@123', role: 'admin', phone: '+91 98400 11001' });
  const demoStudent = await User.create({ name: 'Rahul Sharma', email: 'student@meridian.edu', password: 'Student@123', role: 'student', phone: '+91 98400 22002' });

  const firstNames = ['Aarav', 'Diya', 'Ishaan', 'Meera', 'Vihaan', 'Ananya', 'Arjun', 'Kavya', 'Rohan', 'Sneha', 'Karthik', 'Pooja', 'Aditya', 'Nisha', 'Siddharth', 'Riya'];
  const lastNames = ['Patel', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Menon', 'Joshi', 'Rao', 'Kulkarni', 'Verma', 'Krishnan', 'Bhat'];
  const cities = [['Chennai', 'Tamil Nadu', '600001'], ['Bengaluru', 'Karnataka', '560001'], ['Hyderabad', 'Telangana', '500001'], ['Coimbatore', 'Tamil Nadu', '641001'], ['Pune', 'Maharashtra', '411001'], ['Vellore', 'Tamil Nadu', '632001']];
  const boards = ['CBSE', 'State Board', 'ICSE'];
  const categories = ['OC', 'BC', 'MBC', 'SC', 'ST'];
  const genders = ['Male', 'Female'];

  const courses = await Course.insertMany(coursesData);
  console.log(`Seeded ${courses.length} courses with curricula.`);

  const scholarships = await Scholarship.insertMany(scholarshipsData);
  console.log(`Seeded ${scholarships.length} scholarships.`);

  console.log('Seeding cutoffs...');
  const baseByCode = Object.fromEntries(coursesData.map((c) => [c.code.toUpperCase(), c.cutoffBase]));
  const cutoffDocs = [];
  for (const course of courses) {
    const base = baseByCode[course.code.toUpperCase()];
    for (const quota of ['government', 'management']) {
      for (const category of ['OC', 'BC', 'MBC', 'SC', 'ST']) {
        const b = base[category];
        if (quota === 'management') {
          cutoffDocs.push({ course: course._id, year: YEAR, quota, category, openingMark: +(b - 4 + 1.5).toFixed(2), closingMark: +(b - 12).toFixed(2) });
        } else {
          cutoffDocs.push({ course: course._id, year: YEAR, quota, category, openingMark: +(b + 1.5).toFixed(2), closingMark: +(b - 8 + randInt(0, 20) / 10).toFixed(2) });
        }
      }
    }
    cutoffDocs.push({ course: course._id, year: YEAR - 1, quota: 'government', category: 'OC', openingMark: +(base.OC + 0.75).toFixed(2), closingMark: +(base.OC - 7.5).toFixed(2) });
  }
  await Cutoff.insertMany(cutoffDocs);
  console.log(`Seeded ${cutoffDocs.length} cutoff rows.`);

  console.log('Seeding sample applications...');
  const statuses = ['submitted', 'under_review', 'documents_pending', 'verified', 'accepted', 'rejected'];
  const demoApp = await Application.create({
    student: demoStudent._id,
    status: 'submitted',
    course: courses[0]._id,
    quota: 'government',
    category: 'OC',
    personal: {
      fullName: 'Rahul Sharma', dob: new Date('2008-04-12'), gender: 'Male', email: demoStudent.email, phone: '+91 98400 22002',
      parentName: 'Rajesh Sharma', parentPhone: '+91 98400 22003',
      address: { street: '12, Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
    },
    academic: {
      tenth: { school: 'DAV Senior Secondary', board: 'CBSE', year: 2024, percentage: 92.4 },
      twelfth: { school: 'DAV Senior Secondary', board: 'CBSE', year: 2026, percentage: 94.2, cutOffMark: 191.5 },
    },
    timeline: [{ status: 'submitted', note: 'Application submitted successfully', at: new Date() }],
  });

  const applicationCount = 26;
  for (let i = 0; i < applicationCount; i++) {
    const name = `${randomOf(firstNames)} ${randomOf(lastNames)}`;
    const [city, state, pincode] = randomOf(cities);
    const course = randomOf(courses);
    const quota = Math.random() < 0.62 ? 'government' : Math.random() < 0.75 ? 'management' : 'scholarship';
    const category = randomOf(categories);
    const percentage = +(randInt(72, 98) + Math.random()).toFixed(1);
    const status = statuses[i % statuses.length];
    const email = `${name.toLowerCase().replace(/[^a-z]/g, '.')}${i}@example.com`;
    const user = await User.create({
      name, email, password: 'Student@123', role: 'student', phone: `+91 9${randInt(100000000, 999999999)}`,
    });
    const timeline = [{ status: 'submitted', note: 'Application submitted successfully', at: new Date(Date.now() - randInt(2, 45) * 86400000) }];
    if (status !== 'submitted') {
      timeline.push({ status: 'under_review', note: 'Application taken up for review', at: new Date(Date.now() - randInt(1, 20) * 86400000) });
    }
    if (status === 'documents_pending') {
      timeline.push({ status: 'documents_pending', note: 'Community certificate missing — re-upload required', at: new Date(Date.now() - randInt(1, 8) * 86400000) });
    }
    if (['verified', 'accepted'].includes(status)) {
      timeline.push({ status: 'verified', note: 'All documents verified', at: new Date(Date.now() - randInt(1, 10) * 86400000) });
    }
    if (status === 'accepted') {
      timeline.push({ status: 'accepted', note: 'Admission offer extended — pay admission fee to confirm seat', at: new Date(Date.now() - randInt(0, 5) * 86400000) });
    }
    if (status === 'rejected') {
      timeline.push({ status: 'rejected', note: 'Did not meet the cutoff for the selected quota', at: new Date(Date.now() - randInt(1, 9) * 86400000) });
    }
    const app = await Application.create({
      student: user._id,
      status,
      course: course._id,
      quota,
      category,
      scholarship: quota === 'scholarship' ? randomOf(scholarships)._id : null,
      personal: {
        fullName: name, dob: new Date(randInt(2004, 2008), randInt(0, 11), randInt(1, 28)), gender: randomOf(genders),
        email, phone: user.phone, parentName: `${randomOf(firstNames)} ${lastNames[0]}`, parentPhone: `+91 9${randInt(100000000, 999999999)}`,
        address: { street: `${randInt(1, 120)}, ${randomOf(['Gandhi Road', 'MG Road', 'Temple Street', 'Lake View Avenue'])}`, city, state, pincode },
      },
      academic: {
        tenth: { school: `${city} Public School`, board: randomOf(boards), year: randInt(2022, 2024), percentage: +(percentage - randInt(0, 5)).toFixed(1) },
        twelfth: { school: `${city} Public School`, board: randomOf(boards), year: YEAR, percentage, cutOffMark: +(percentage * 2 - randInt(0, 14)).toFixed(2) },
      },
      timeline,
    });
    if (status !== 'submitted') {
      await Payment.create({
        student: user._id, application: app._id, type: 'application_fee', amount: 1000,
        method: randomOf(['upi', 'card', 'netbanking']), status: 'success',
        transactionId: `TXN${Date.now() - randInt(1e7, 9e7)}${i}`, paidAt: timeline[0].at,
      });
    }
    if (status === 'accepted' && i % 2 === 0) {
      const discount = quota === 'scholarship' ? 25 : 0;
      await Payment.create({
        student: user._id, application: app._id, type: 'admission_fee',
        amount: Math.round((quota === 'management' ? course.mgmtAnnualFee : course.annualFee) * (1 - discount / 100)),
        method: randomOf(['upi', 'netbanking']), status: 'success',
        transactionId: `TXN${Date.now() - randInt(1e6, 9e6)}${i}`, paidAt: new Date(Date.now() - randInt(0, 4) * 86400000),
      });
    }
  }
  await Payment.create({
    student: demoStudent._id, application: demoApp._id, type: 'application_fee', amount: 1000,
    method: 'upi', status: 'success', transactionId: `TXN${Date.now()}SEED`, paidAt: new Date(),
  });

  await Notification.insertMany([
    { user: null, role: 'student', title: 'Admissions 2026 Open', message: 'Applications are now open for all UG programs. Government quota closes on 31 Dec 2026.', type: 'info' },
    { user: null, role: 'student', title: 'New Scholarship Announced', message: 'STEM Women\u2019s Scholarship (30% waiver) is now accepting applications until 15 Dec 2026.', type: 'success' },
    { user: admin._id, role: null, title: 'Welcome to the Admin Console', message: 'Monitor applications, verify documents and manage quotas from this dashboard.', type: 'info' },
  ]);

  console.log('\n=== Seed complete ===');
  console.log('Admin login   : admin@meridian.edu / Admin@123');
  console.log('Student login : student@meridian.edu / Student@123');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
