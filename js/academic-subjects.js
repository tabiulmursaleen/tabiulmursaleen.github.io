const ninthGradeSubjects = [
  { name: "বাংলা–১", code: "৫১৯১১ / ৪১৯১১ / ১৯১১" },
  { name: "ইংরেজি–১", code: "৫১৯১২ / ৪১৯১২ / ১৯১২" },
  { name: "গণিত–১", code: "৫১৯১৩ / ৪১৯১৩ / ১৯১৩" },
  { name: "বাংলাদেশ ও বিশ্বপরিচয়–১", code: "৫১৯১৪ / ৪১৯১৪ / ১৯১৪" },
  { name: "পদার্থবিজ্ঞান–১", code: "৫১৯১৫ / ৪১৯১৫ / ১৯১৫" },
  { name: "রসায়ন–১", code: "৫১৯১৬ / ১৯১৬" },
  { name: "ইসলাম শিক্ষা–১", code: "৫১২১১ / ৪১৭১১ / ১২১১" },
  { name: "হিন্দুধর্ম শিক্ষা–১", code: "৫১২১২ / ৪১৭১২ / ১২১২" },
  { name: "খ্রিষ্টধর্ম শিক্ষা–১", code: "৫১২১৩ / ৪১৭১৩ / ১২১৩" },
  { name: "কৃষিশিক্ষা–১", code: "৫১৩১২" },
  { name: "এগ্রো বেইজড ফুড–১", code: "৫৬১১৩ / ৪৬১১১ / ৬১১৩" },
  { name: "অ্যাপারেল–১", code: "৫৮১১৩ / ৪৮১১১ / ৮১১৩" },
  { name: "জেনারেল মেকানিক্স–১", code: "৫৭৭১৩ / ৪৭৭১১ / ৭৭১৩" },
  { name: "আইটি সাপোর্ট–১", code: "৫৮৮১৩ / ৪৮৮১১ / ৮৮১৩" },
  { name: "জেনারেল ইলেকট্রনিক্স–১", code: "৫৬২১৩ / ৪৬২১১ / ৬২১৩" },
  { name: "এগ্রো বেইজড ফুড–২", code: "৫৬১১৪ / ৪৬১১২ / ৬১১৪" },
  { name: "অ্যাপারেল–২", code: "৫৮১১৪ / ৪৮১১২ / ৮১১৪" },
  { name: "জেনারেল মেকানিক্স–২", code: "৫৭৭১৪ / ৪৭৭১২ / ৭৭১৪" },
  { name: "আইটি সাপোর্ট–২", code: "৫৮৮১৪ / ৪৮৮১২ / ৮৮১৪" },
  { name: "জেনারেল ইলেকট্রনিক্স–২", code: "৫৬২১৪ / ৪৬২১২ / ৬২১৪" },
  { name: "ইঞ্জিনিয়ারিং ড্রয়িং", code: "৫১৯১৬" },
  { name: "কম্পিউটার অ্যাপ্লিকেশন–১", code: "৫১৯১৭" }
];

const tenthGradeSubjects = [
  { name: "বাংলা–২", code: "১৯২১ / ৫১৯২১" },
  { name: "ইংরেজি–২", code: "১৯২২ / ৫১৯২২" },
  { name: "গণিত–২", code: "১৯২৩ / ৫১৯২৩" },
  { name: "বাংলাদেশ ও বিশ্বপরিচয়–২", code: "৫১৯২৪ / ১৯২৪" },
  { name: "পদার্থবিজ্ঞান–২", code: "১৯২৫ / ৫১৯২৫" },
  { name: "রসায়ন–২", code: "১৯২৬ / ৫১৯২৬" },
  { name: "ইসলাম শিক্ষা–২", code: "৫১২২১ / ১২২১" },
  { name: "হিন্দুধর্ম শিক্ষা–২", code: "৫১২১২ / ৪১৭১২ / ১২১২" },
  { name: "খ্রিষ্টধর্ম শিক্ষা–২", code: "৫১২১৩ / ৪১৭১৩ / ১২১৩" },
  { name: "কৃষিশিক্ষা–২", code: "৫১৩২২" },
  { name: "এগ্রো বেইজড ফুড–৩", code: "৬১২৩ / ৫৬১২৩" },
  { name: "অ্যাপারেল–৩", code: "৮১২৩ / ৫৮၁২৩" },
  { name: "জেনারেল মেকানিক্স–৩", code: "৭৭২৩ / ৫৭৭২৩" },
  { name: "আইটি সাপোর্ট–৩", code: "৮৮২৩ / ৫৮৮২৩" },
  { name: "জেনারেল ইলেকট্রনিক্স–৩", code: "৬২২৩ / ৫৬২২৩" },
  { name: "এগ্রো বেইজড ফুড–৪", code: "৬১২৪ / ৫৬১২৪" },
  { name: "অ্যাপারেল–৪", code: "৮১২৪ / ৫৮১২৪" },
  { name: "জেনারেল মেকানিক্স–৪", code: "৭৭২৪ / ৫৭৭২৪" },
  { name: "আইটি সাপোর্ট–৪", code: "৮৮২৪ / ৫৮৮২৪" },
  { name: "জেনারেল ইলেকট্রনিক্স–৪", code: "৬২২৪ / ৫৬২২৪" },
  { name: "আত্মকর্মসংস্থান ও ব্যবসায় উদ্যোগ", code: "১৯২৮ / ৫১৯২৮" },
  { name: "কম্পিউটার অ্যাপ্লিকেশন–২", code: "৫১৯২৭" }
];

const genericTradeSubjects = [
  { name: "ট্রেড ১", code: "" },
  { name: "ট্রেড ২", code: "" },
  { name: "ট্রেড ৩", code: "" },
  { name: "ট্রেড ৪", code: "" }
];

const classSubjects = {
  "09": [...ninthGradeSubjects, ...genericTradeSubjects],
  "10": [...tenthGradeSubjects, ...genericTradeSubjects],
  // College subject lists are provisional and currently follow the supplied school list.
  "11": [...ninthGradeSubjects, ...tenthGradeSubjects, ...genericTradeSubjects],
  "12": [...ninthGradeSubjects, ...tenthGradeSubjects, ...genericTradeSubjects]
};

export function academicClassCode(value) {
  const normalized = String(value || "").replace(/[০-৯]/g, (digit) => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(digit)]);
  const aliases = new Map([
    ["নবম", "09"], ["নবম শ্রেণি", "09"], ["নবম শ্রেণী", "09"],
    ["দশম", "10"], ["দশম শ্রেণি", "10"], ["দশম শ্রেণী", "10"],
    ["একাদশ", "11"], ["একাদশ শ্রেণি", "11"], ["একাদশ শ্রেণী", "11"],
    ["দ্বাদশ", "12"], ["দ্বাদশ শ্রেণি", "12"], ["দ্বাদশ শ্রেণী", "12"]
  ]);
  const key = normalized.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  return aliases.get(key) || key.match(/(?:^|\D)(9|10|11|12)(?:$|\D)/)?.[1]?.padStart(2, "0") || "";
}

export function getAcademicSubjects(className) {
  return classSubjects[academicClassCode(className)] || [];
}

export function findAcademicSubject(className, subjectName) {
  const normalized = String(subjectName || "").replace(/[–—-]/g, "-").trim().toLocaleLowerCase();
  return getAcademicSubjects(className).find((subject) =>
    subject.name.replace(/[–—-]/g, "-").trim().toLocaleLowerCase() === normalized
  ) || null;
}
