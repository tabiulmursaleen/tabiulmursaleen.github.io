const ninthGradeSubjects = [
  { name: "আইটি সাপোর্ট এন্ড আইওটি বেসিকস ২", code: "58814 / 48812 / 8814" },
  { name: "জেনারেল ইলেকট্রনিক্স 2", code: "56214 / 46212 / 6214" },
  { name: "ইঞ্জিনিয়ারিং ড্রইং", code: "51916" },
  { name: "কম্পিউটার অ্যাপ্লিকেশন 1", code: "51917" }
];

const tenthGradeSubjects = [
  { name: "বাংলা 2", code: "1921 / 51921" },
  { name: "ইংরেজি 2", code: "1922 / 51922" },
  { name: "গণিত 2", code: "1923 / 51923" },
  { name: "বাওবি 2", code: "51924 / 1924" },
  { name: "পদার্থ 2", code: "1925 / 51925" },
  { name: "রসায়ন 2", code: "1926 / 51926" },
  { name: "ইসলাম শিক্ষা 2", code: "51221 / 1221" },
  { name: "হিন্দু ধর্ম শিক্ষা 2", code: "51212 / 41712 / 1212" },
  { name: "খ্রিস্ট ধর্ম শিক্ষা 2", code: "51213 / 41713 / 1213" },
  { name: "কৃষিশিক্ষা 2", code: "51322" },
  { name: "এগ্রো বেসড ফুড 3", code: "6123 / 56123" },
  { name: "এপারেল 3", code: "8123 / 58123" },
  { name: "জেনারেল মেকানিক্স 3", code: "7723 / 57723" },
  { name: "আইটি সাপোর্ট এন্ড আইওটি বেসিকস ৩", code: "8823 / 58823" },
  { name: "জেনারেল ইলেকট্রনিক্স 3", code: "6223 / 56223" },
  { name: "এগ্রো বেসড ফুড 4", code: "6124 / 56124" },
  { name: "এপারেল 4", code: "8124 / 58124" },
  { name: "জেনারেল মেকানিক্স 4", code: "7724 / 57724" },
  { name: "আইটি সাপোর্ট এন্ড আইওটি বেসিকস ৪", code: "8824 / 58824" },
  { name: "জেনারেল ইলেকট্রনিক্স 4", code: "6224 / 56224" },
  { name: "আত্মকর্মসংস্থান ও ব্যবসায় উদ্যোগ", code: "1928 / 51928" },
  { name: "কম্পিউটার অ্যাপ্লিকেশন 2", code: "51927" }
];

const classSubjects = {
  // Until grade-specific mapping is supplied, make the complete provided
  // catalogue available for every class in the secondary/college branches.
  "09": [...ninthGradeSubjects, ...tenthGradeSubjects],
  "10": [...ninthGradeSubjects, ...tenthGradeSubjects],
  // College subject lists are provisional and currently follow the supplied school list.
  "11": [...ninthGradeSubjects, ...tenthGradeSubjects],
  "12": [...ninthGradeSubjects, ...tenthGradeSubjects]
};

export function academicClassCode(value) {
  const normalized = String(value || "").replace(/[০-৯]/g, (digit) => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(digit)]);
  const aliases = new Map([
    ["নবম", "09"], ["নবম শ্রেণি", "09"], ["দশম", "10"], ["দশম শ্রেণি", "10"],
    ["একাদশ", "11"], ["একাদশ শ্রেণি", "11"], ["দ্বাদশ", "12"], ["দ্বাদশ শ্রেণি", "12"]
  ]);
  const key = normalized.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  return aliases.get(key) || key.match(/(?:^|\D)(9|10|11|12)(?:$|\D)/)?.[1]?.padStart(2, "0") || "";
}

export function getAcademicSubjects(className) {
  return classSubjects[academicClassCode(className)] || [];
}

export function findAcademicSubject(className, subjectName) {
  const normalized = String(subjectName || "").trim().toLocaleLowerCase();
  return getAcademicSubjects(className).find((subject) => subject.name.toLocaleLowerCase() === normalized) || null;
}
