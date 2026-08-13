// Excel-এর Serial 1 = teacher-01.jpg, Serial 2 = teacher-02.jpg, ইত্যাদি।
const teacherPhotoBySerial = serial =>
  `images/teachers/teacher-${String(serial).padStart(2, "0")}.jpg`;

const teachers = [
  { id: "teacher-01", name: "জনাব মোহাম্মদ রফিকুল ইসলাম", index: "803257", designation: "অধ্যক্ষ", subject: "", qualification: "এম.এ", joiningDate: "১৭ এপ্রিল ২০২৪", experience: "", dob: "১১ অক্টোবর ১৯৭৭", phone: "01716858193", blood: "", photo: "images/teachers/teacher-01.jpg" },

  { id: "teacher-02", name: "জনাব মুহাম্মদ মাসুদ রানা", index: "25090054", designation: "প্রভাষক", subject: "ব্যবসায় ডিজিটাল প্রযুক্তি", qualification: "এম.এ", joiningDate: "২ নভেম্বর ২০১৫", experience: "", dob: "১ ফেব্রুয়ারি ১৯৭৯", phone: "01879989979", blood: "A+", photo: "images/teachers/teacher-02.jpg" },

  { id: "teacher-03", name: "জনাব মোঃ শফিউল আলিম হোসেন", index: "25090056", designation: "প্রভাষক", subject: "ইংরেজি", qualification: "এম.এ", joiningDate: "১ নভেম্বর ২০১৫", experience: "", dob: "১২ ডিসেম্বর ১৯৮০", phone: "01929617490", blood: "A+", photo: "images/teachers/teacher-03.jpg" },

  { id: "teacher-04", name: "জনাব নাজমা আক্তার", index: "25090055", designation: "প্রভাষক", subject: "কম্পিউটারাইজড অ্যাকাউন্টিং সিস্টেম", qualification: "এম.এ", joiningDate: "১ নভেম্বর ২০১৫", experience: "", dob: "১৪ জুলাই ১৯৮৫", phone: "01603606325", blood: "B+", photo: "images/teachers/teacher-04.jpg" },

  { id: "teacher-05", name: "জনাব আলমগীর কবির", index: "25090057", designation: "প্রভাষক", subject: "বাংলা", qualification: "এম.এ", joiningDate: "১ নভেম্বর ২০১৫", experience: "", dob: "১৫ অক্টোবর ১৯৮৬", phone: "01717738563", blood: "A+", photo: "images/teachers/teacher-05.jpg" },

  { id: "teacher-06", name: "জনাব মোঃ সাইফুল ইসলাম", index: "25090058", designation: "প্রভাষক", subject: "ব্যবস্থাপনা", qualification: "এম.এ", joiningDate: "১ নভেম্বর ২০১৫", experience: "", dob: "১ জানুয়ারি ১৯৮৭", phone: "01929617490", blood: "B+", photo: "images/teachers/teacher-06.jpg" },

  { id: "teacher-07", name: "জনাব মোঃ শামীম মিয়া", index: "26050028", designation: "প্রভাষক", subject: "গণিত", qualification: "এম.এ", joiningDate: "১৭ ফেব্রুয়ারি ২০২৬", experience: "", dob: "১৩ মার্চ ১৯৯৮", phone: "01942976197", blood: "", photo: "images/teachers/teacher-07.jpg" },

  { id: "teacher-08", name: "জনাব মোঃ কামরুজ্জামান খন্দকার", index: "24204093", designation: "সহকারী শিক্ষক", subject: "শারীরিক শিক্ষা", qualification: "এম.এ", joiningDate: "১ অক্টোবর ২০২৩", experience: "", dob: "১১ নভেম্বর ১৯৮৬", phone: "01717110076", blood: "B+", photo: "images/teachers/teacher-08.jpg" },

  { id: "teacher-09", name: "জনাব দ্বিপ্তী রাণী", index: "25120253", designation: "ট্রেড ইনস্ট্রাক্টর", subject: "এগ্রোবেসড ফুড", qualification: "বিএসসি", joiningDate: "৮ সেপ্টেম্বর ২০২৫", experience: "", dob: "১২ জুলাই ১৯৯৪", phone: "01761316783", blood: "", photo: "images/teachers/teacher-09.jpg" },

  { id: "teacher-10", name: "জনাব জামিল হোসেন", index: "26010283", designation: "ট্রেড ইনস্ট্রাক্টর", subject: "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", qualification: "বিএসএস", joiningDate: "৮ সেপ্টেম্বর ২০২৫", experience: "", dob: "১৬ অক্টোবর ১৯৯৫", phone: "01741753844", blood: "O+", photo: "images/teachers/teacher-10.jpg" },

  { id: "teacher-11", name: "জনাব ইমদাদুল হক", index: "26010279", designation: "ট্রেড ইনস্ট্রাক্টর", subject: "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", qualification: "বিএসসি", joiningDate: "১ সেপ্টেম্বর ২০২৪", experience: "", dob: "১ জানুয়ারি ১৯৯২", phone: "01721342857", blood: "AB+", photo: "images/teachers/teacher-11.jpg" },

  { id: "teacher-12", name: "জনাব মোঃ শফিউল আলম", index: "24112084", designation: "সহকারী শিক্ষক", subject: "কৃষিশিক্ষা", qualification: "এম.এ", joiningDate: "১ অক্টোবর ২০২৩", experience: "", dob: "৫ ডিসেম্বর ১৯৮৫", phone: "01718893632", blood: "A+", photo: "images/teachers/teacher-12.jpg" },

  { id: "teacher-13", name: "জনাব নাহিদা ফেরদৌসী", index: "24206170", designation: "সহকারী শিক্ষক", subject: "বাংলা", qualification: "এম.এ", joiningDate: "১ অক্টোবর ২০২৩", experience: "", dob: "১ এপ্রিল ১৯৮৬", phone: "01687616795", blood: "O+", photo: "images/teachers/teacher-13.jpg" },

  { id: "teacher-14", name: "জনাব মোঃ রবিউল আলম", index: "24204094", designation: "সহকারী শিক্ষক", subject: "সামাজিক বিজ্ঞান", qualification: "এম.এ", joiningDate: "১ অক্টোবর ২০২৩", experience: "", dob: "৮ জুলাই ১৯৮৭", phone: "01723938865", blood: "O+", photo: "images/teachers/teacher-14.jpg" },

  { id: "teacher-15", name: "জনাব তানজিলা আক্তার", index: "25060219", designation: "সহকারী শিক্ষক", subject: "ইংরেজি", qualification: "এম.এ", joiningDate: "১ সেপ্টেম্বর ২০২৪", experience: "", dob: "১ জানুয়ারি ১৯৯২", phone: "01756520941", blood: "", photo: "images/teachers/teacher-15.jpg" },

  { id: "teacher-16", name: "জনাব ছাদিকুল ইসলাম", index: "24204092", designation: "সহকারী শিক্ষক", subject: "ইসলাম ধর্ম", qualification: "এম.এ", joiningDate: "১ অক্টোবর ২০২৩", experience: "", dob: "১৫ জানুয়ারি ১৯৯২", phone: "01738236721", blood: "O+", photo: "images/teachers/teacher-16.jpg" },

  { id: "teacher-17", name: "জনাব মোঃ সাইফুল ইসলাম", index: "25060218", designation: "সহকারী শিক্ষক", subject: "রসায়ন", qualification: "এম.এ", joiningDate: "১ সেপ্টেম্বর ২০২৪", experience: "", dob: "৩ অক্টোবর ১৯৯৩", phone: "01935719367", blood: "O+", photo: "images/teachers/teacher-17.jpg" }
];

teachers.forEach(teacher => {
  teacher.serial = Number(teacher.id.replace("teacher-", ""));
  teacher.photo = teacherPhotoBySerial(teacher.serial);
});

const joiningDates = {
  "teacher-01": "2024-04-17",
  "teacher-02": "2015-11-02",
  "teacher-03": "2015-11-01",
  "teacher-04": "2015-11-01",
  "teacher-05": "2015-11-01",
  "teacher-06": "2015-11-01",
  "teacher-07": "2026-02-17",
  "teacher-08": "2023-10-01",
  "teacher-09": "2025-09-08",
  "teacher-10": "2025-09-08",
  "teacher-11": "2024-09-01",
  "teacher-12": "2023-10-01",
  "teacher-13": "2023-10-01",
  "teacher-14": "2023-10-01",
  "teacher-15": "2024-09-01",
  "teacher-16": "2023-10-01",
  "teacher-17": "2024-09-01"
};

const toBanglaNumber = number =>
  String(number).replace(/\d/g, digit => "০১২৩৪৫৬৭৮৯"[digit]);

function calculateExperience(joiningDate) {
  const [year, month, day] = joiningDate.split("-").map(Number);

  const today = new Date();

  let years = today.getFullYear() - year;
  let months = today.getMonth() + 1 - month;

  if (today.getDate() < day) months--;

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];

  if (years > 0) {
    parts.push(`${toBanglaNumber(years)} বছর`);
  }

  if (months > 0 || parts.length === 0) {
    parts.push(`${toBanglaNumber(months)} মাস`);
  }

  return parts.join(" ");
}

teachers.forEach(teacher => {
  teacher.joiningDateIso = joiningDates[teacher.id];
  teacher.experience = calculateExperience(teacher.joiningDateIso);
});