const pairs = [
  ["অ্যাডমিন ড্যাশবোর্ড", "Admin Dashboard"],
  ["তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ", "Tabiul Mursaleen Nogor Karigori School & College"],
  ["অ্যাডমিন মেনু", "Admin menu"],
  ["এডিট প্রোফাইল", "Edit Profile"], ["লগআউট", "Log Out"],
  ["অ্যাডমিন প্রোফাইল সম্পাদনা", "Edit Admin Profile"], ["নাম", "Name"],
  ["প্রোফাইল ছবির লিংক", "Profile Photo URL"],
  ["Google Drive-এর ছবি হলে শেয়ার সেটিং “Anyone with the link” করে লিংক দিন।", "For a Google Drive photo, enable “Anyone with the link” and paste its URL."],
  ["ইংরেজি অক্ষরে লিখুন।", "Enter text using English characters only."],
  ["বাতিল", "Cancel"], ["সংরক্ষণ", "Save"], ["স্বাগতম, অ্যাডমিন!", "Welcome, Admin!"],
  ["শিক্ষার্থী নিবন্ধন", "Student Registration"], ["শিক্ষার্থীর তথ্য সংরক্ষণ ও তালিকা পরিচালনা করুন।", "Save student details and manage the student list."],
  ["বেতন ব্যবস্থাপনা", "Fee Management"], ["মাসিক বেতন ও অন্যান্য ফি আদায়ের হিসাব রাখুন।", "Record monthly tuition and other fee payments."],
  ["ফলাফল ব্যবস্থাপনা", "Result Management"], ["বিষয়ভিত্তিক নম্বর ও প্রকাশিত ফলাফল পরিচালনা করুন।", "Manage subject marks and published results."],
  ["নোটিশ ব্যবস্থাপনা", "Notice Management"], ["নোটিশ যোগ, সম্পাদনা ও প্রকাশ করুন।", "Add, edit, and publish notices."],
  ["রুটিন ব্যবস্থাপনা", "Routine Management"], ["ক্লাস ও পরীক্ষার রুটিন পরিচালনা করুন।", "Manage class and exam routines."],
  ["স্কুল ও কলেজ শাখার রুটিন আলাদাভাবে সম্পাদনা করুন। শিক্ষক সংকেতের পাশে সম্পূর্ণ নাম ও ছবির লিংক যোগ করা যাবে। প্রকাশিত রুটিন সাইটে দেখা যাবে।", "Edit the school and college timetables separately. Add each teacher’s full name and photo URL beside their initials. Published routines appear on the website."],
  ["শিক্ষকের সংকেত ও পরিচিতি", "Teacher Codes and Profiles"], ["শাখা", "Branch"], ["স্কুল শাখা", "School Branch"], ["কলেজ শাখা", "College Branch"],
  ["কার্যকর হওয়ার তারিখ", "Effective Date"], ["ওয়েবসাইটে প্রকাশ করুন", "Publish on Website"],
  ["সংকেত", "Code"], ["শিক্ষকের নাম", "Teacher Name"], ["ছবির পাথ (ঐচ্ছিক)", "Photo Path (Optional)"],
  ["+ শিক্ষক যোগ করুন", "+ Add Teacher"], ["ক্লাস রুটিন", "Class Routine"],
  ["প্রতিটি ঘরে বিষয় এবং প্রয়োজনে পরের লাইনে শিক্ষক সংকেত লিখুন। যেমন: গণিত, পরের লাইনে JH।", "Enter the subject in each cell and, optionally, the teacher code on the next line. Example: Math, then JH on the next line."],
  ["বার", "Day"], ["শ্রেণি", "Class"], ["যেমন: JH", "Example: JH"], ["শিক্ষকের সম্পূর্ণ নাম", "Teacher’s Full Name"],
  ["পিরিয়ড ও সময়", "Period and Time"], ["রুটিন সংরক্ষণ", "Save Routine"], ["মুছুন", "Delete"],
  ["রুটিন লোড হচ্ছে...", "Loading routine..."], ["সংরক্ষিত রুটিন লোড হয়েছে।", "Saved routine loaded."],
  ["Excel থেকে রুটিন লোড হয়েছে। পরিবর্তন করে সংরক্ষণ করুন।", "Routine loaded from Excel. Make changes and save."],
  ["ডাটাবেজ থেকে রুটিন লোড হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not load the routine from the database. Check Firestore access rules."],
  ["ডাটাবেজের লাইভ আপডেট পাওয়া যায়নি; Excel-এর প্রাথমিক রুটিন দেখানো হচ্ছে।", "Live database updates are unavailable; showing the initial Excel timetable."],
  ["প্রতিটি শিক্ষক-সংকেতে সংকেত ও নাম দুটিই দিন।", "Enter both a code and a name for every teacher."],
  ["একই সংকেত একাধিকবার দেওয়া হয়েছে:", "This teacher code is duplicated:"],
  ["শিক্ষাবর্ষ ও কার্যকর হওয়ার তারিখ দিন।", "Enter the academic year and effective date."],
  ["প্রতিটি বার ও শ্রেণির নাম পূরণ করুন।", "Enter every day and class name."],
  ["প্রতিটি পিরিয়ডের শিরোনাম ও সময় পূরণ করুন।", "Enter a title and time for every period."],
  ["রুটিন সংরক্ষণ হচ্ছে...", "Saving routine..."], ["রুটিন সংরক্ষিত ও ওয়েবসাইটে প্রকাশিত হয়েছে।", "Routine saved and published on the website."],
  ["একই সংকেত একাধিকবার দেওয়া হয়েছে।", "This teacher code is duplicated. Use each code only once."],
  ["রুটিন সংরক্ষিত হয়েছে; ওয়েবসাইটে দেখাতে প্রকাশের ঘরটি নির্বাচন করুন।", "Routine saved. Select Publish on Website to show it publicly."],
  ["রুটিন সংরক্ষণ হয়নি। Firestore access rules ও সংযোগ পরীক্ষা করুন।", "Could not save the routine. Check Firestore access rules and your connection."],
  ["এডমিট কার্ড ম্যানেজমেন্ট", "Admit Card Management"], ["শিক্ষার্থীদের এডমিট কার্ড তৈরি ও পরিচালনা করুন।", "Create and manage student admit cards."],
  ["এই বিভাগে শিক্ষার্থী নির্বাচন করে এডমিট কার্ড তৈরি ও প্রিন্টের ব্যবস্থা যুক্ত হবে।", "This section will let you select students and create and print admit cards."],
  ["নোটিশের শিরোনাম", "Notice Title"], ["নোটিশের বিবরণ", "Notice Details"],
  ["PDF-এর লিংক (ঐচ্ছিক)", "PDF URL (Optional)"], ["এখনই প্রকাশ করব", "Publish now"],
  ["নোটিশ সংরক্ষণ", "Save Notice"], ["সম্পাদনা বাতিল", "Cancel Edit"], ["সংরক্ষিত নোটিশসমূহ", "Saved Notices"],
  ["নোটিশ লোড হচ্ছে...", "Loading notices..."],
  ["শিক্ষার্থী আইডি", "Student ID"], ["সেভের পর তৈরি হবে", "Generated after saving"], ["সাবমিটের পর তৈরি হবে", "Generated after submission"],
  ["সাবমিটের পর স্বয়ংক্রিয়ভাবে তৈরি হবে।", "Generated automatically after submission."],
  ["ট্রেড নির্বাচন করুন", "Select a trade"],
  ["শিক্ষার্থীর নাম", "Student Name"], ["শাখা", "Branch"],
  ["শাখা নির্বাচন করুন", "Select a branch"], ["স্কুল", "School"], ["কলেজ", "College"],
  ["বোর্ড রেজিস্ট্রেশন তথ্য", "Board Registration Details"], ["বোর্ডের তথ্য দিন", "Enter Board Details"], ["বোর্ড রোল", "Board Roll"], ["বোর্ড রেজি. নম্বর", "Board Registration No."],
  ["শ্রেণি", "Class"], ["শ্রেণি নির্বাচন করুন", "Select a class"], ["ট্রেড", "Trade"],
  ["প্রতিষ্ঠানের ট্রেডের নাম লিখুন", "Enter or select an institutional trade"], ["রোল নম্বর", "Roll Number"],
  ["জন্মতারিখ", "Date of Birth"], ["লিঙ্গ", "Gender"], ["নির্বাচন করুন", "Select"], ["ছাত্র", "Male"], ["ছাত্রী", "Female"], ["অন্যান্য", "Other"], ["ভর্তির তারিখ", "Admission Date"], ["পিতার নাম", "Father's Name"], ["মাতার নাম", "Mother's Name"],
  ["জন্মনিবন্ধন সনদে যেভাবে বানান লেখা আছে, পিতার ও মাতার নাম ঠিক সেভাবেই লিখুন।", "Enter both parents' names exactly as spelled on the birth registration certificate."],
  ["জন্মনিবন্ধন অনুযায়ী", "As on birth certificate"],
  ["অভিভাবকের মোবাইল", "Guardian Phone"], ["জরুরি যোগাযোগের নম্বর", "Emergency Contact Number"], ["ছবির Google Drive লিংক", "Student Photo Google Drive Link"], ["Drive-এ JPG ছবি আপলোড করে “Anyone with the link — Viewer” করুন। ৫০০ কেবির নিচে রাখুন।", "Upload a JPG photo to Drive and set access to “Anyone with the link — Viewer”. Keep it under 500 KB."], ["শিক্ষার্থীর ছবির Google Drive লিংক দিন।", "Enter the student's Google Drive photo link."], ["সঠিক Google Drive শেয়ার লিংক দিন।", "Enter a valid Google Drive sharing link."], ["ছবির লিংক https:// দিয়ে শুরু হতে হবে।", "The photo link must start with https://."], ["Google Drive-এর শেয়ার লিংক ব্যবহার করুন।", "Use a Google Drive sharing link."], ["Drive লিংকটি থেকে ছবির আইডি পাওয়া যায়নি। Copy link দিয়ে আবার চেষ্টা করুন।", "Could not find the image ID in that Drive link. Copy the sharing link and try again."], ["গ্রাম", "Village"], ["উপজেলা", "Upazila"], ["জেলা", "District"],
  ["শিক্ষার্থী তালিকায় প্রকাশ করুন (নাম, আইডি, শিক্ষাবর্ষ, শাখা, শ্রেণি, ট্রেড, রোল ও ছবি প্রকাশ হবে)", "Publish in the student directory (name, ID, academic year, branch, class, trade, roll, and photo will be visible)"],
  ["শিক্ষার্থী সংরক্ষণ", "Save Student"], ["পরিবর্তন সংরক্ষণ", "Save Changes"], ["নিবন্ধিত শিক্ষার্থী", "Registered Students"],
  ["আইডি", "ID"], ["নাম", "Name"], ["শাখা / শ্রেণি", "Branch / Class"], ["রোল", "Roll"], ["ওয়েবসাইটে", "On Website"], ["কাজ", "Actions"],
  ["বেতন ও ফি আদায়", "Tuition and Fee Collection"], ["প্রতিটি জমা আলাদা লেনদেন হিসেবে রেকর্ড হবে। সংরক্ষিত লেনদেন তালিকায় দেখা যাবে।", "Each payment is saved as a separate transaction and appears in the records below."],
  ["শিক্ষার্থী নির্বাচন করুন", "Select a student"], ["ফি-এর ধরন", "Fee Type"], ["নির্বাচন করুন", "Select"],
  ["মাসিক বেতন", "Monthly Tuition"], ["পরীক্ষার ফি", "Exam Fee"], ["ভর্তি ফি", "Admission Fee"], ["অন্যান্য", "Other"],
  ["মাস (প্রযোজ্য হলে)", "Month (if applicable)"], ["পরিমাণ (টাকা)", "Amount (BDT)"], ["জমার তারিখ", "Payment Date"],
  ["পরিশোধের মাধ্যম", "Payment Method"], ["নগদ", "Cash"], ["মোবাইল ব্যাংকিং", "Mobile Banking"], ["ব্যাংক", "Bank"],
  ["রসিদ নম্বর", "Receipt Number"], ["মন্তব্য", "Notes"], ["জমা সংরক্ষণ", "Save Payment"], ["সাম্প্রতিক জমা", "Recent Payments"],
  ["তারিখ", "Date"], ["শিক্ষার্থী", "Student"], ["ফি", "Fee"], ["মাস", "Month"], ["টাকা", "Amount"], ["রসিদ", "Receipt"],
  ["বিষয়ভিত্তিক নম্বর", "Subject Marks"], ["পরীক্ষার নাম", "Exam Name"], ["শিক্ষাবর্ষ", "Academic Year"],
  ["+ বিষয় যোগ", "+ Add Subject"], ["ওয়েবসাইটে ফলাফল প্রকাশ করুন", "Publish results on the website"],
  ["ফলাফল সংরক্ষণ", "Save Results"], ["সংরক্ষিত ফলাফল", "Saved Results"], ["পরীক্ষা", "Exam"], ["মোট নম্বর", "Total Marks"],
  ["প্রকাশিত", "Published"], ["গোপন", "Hidden"], ["সম্পাদনা", "Edit"], ["মুছুন", "Delete"], ["সরান", "Remove"],
  ["পূর্ণমান", "Full Marks"], ["প্রাপ্ত নম্বর", "Marks Obtained"],
  ["বিষয়ের নাম", "Subject Name"],
  ["তথ্য লোড হচ্ছে...", "Loading data..."], ["শিক্ষার্থীর তথ্য লোড হচ্ছে...", "Loading student records..."],
  ["এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি।", "No students have been registered yet."], ["এখনো কোনো জমার তথ্য নেই।", "No payments have been recorded yet."],
  ["এখনো কোনো ফলাফল সংরক্ষণ করা হয়নি।", "No results have been saved yet."], ["এখনো কোনো নোটিশ নেই।", "There are no notices yet."],
  ["শিরোনাম নেই", "Untitled"], ["অবস্থা: প্রকাশিত", "Status: Published"], ["অবস্থা: অপ্রকাশিত", "Status: Unpublished"],
  ["PDF খুলুন", "Open PDF"], ["অপ্রকাশিত করুন", "Unpublish"], ["প্রকাশ করুন", "Publish"],
  ["প্রোফাইল সংরক্ষণ হচ্ছে...", "Saving profile..."], ["প্রোফাইল হালনাগাদ হয়েছে।", "Profile updated."],
  ["প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।", "Could not save the profile. Please try again."],
  ["ছবির লিংক https:// দিয়ে শুরু হতে হবে।", "The photo URL must start with https://."],
  ["ছবির লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে।", "The photo URL must start with https://."],
  ["নাম লিখুন।", "Enter a name."], ["← ড্যাশবোর্ডে ফিরুন", "← Back to Dashboard"],
  ["অ্যাডমিন হিসেবে যাচাই সম্পন্ন হয়েছে।", "Admin verification complete."], ["লগআউট করা যায়নি। আবার চেষ্টা করুন।", "Could not log out. Please try again."],
  ["শ্রেণি 9, 10, 11 বা 12 লিখুন (যেমন নবম বা একাদশ)।", "Enter class 9, 10, 11, or 12 (for example, Class 9 or Class 11)."],
  ["প্রতিষ্ঠানের তালিকাভুক্ত ট্রেডের নাম লিখুন বা নির্বাচন করুন।", "Enter or select one of the institution's listed trades."],
  ["রোল নম্বরে ১–৪ অঙ্কের সঠিক সংখ্যা লিখুন।", "Enter a valid roll number with 1 to 4 digits."],
  ["এই শিক্ষার্থী আইডিটি আগে থেকেই আছে।", "This student ID already exists."],
  ["শিক্ষার্থীর তথ্য সংরক্ষণ হচ্ছে...", "Saving student details..."], ["শিক্ষার্থীর তথ্য ডাটাবেজে সংরক্ষণ হচ্ছে...", "Saving student details to the database..."], ["ছবি আপলোডের অনুমতি নেই। Firebase Storage Rules প্রকাশ করুন।", "Photo upload is not allowed. Deploy the Firebase Storage Rules."], ["ছবি আপলোড ব্যর্থ হয়েছে। সংযোগ ও Firebase Storage Rules পরীক্ষা করুন।", "Photo upload failed. Check your connection and Firebase Storage Rules."], ["ছবি আপলোডে ৬০ সেকেন্ডের বেশি লেগেছে। সংযোগ যাচাই করে আবার চেষ্টা করুন।", "Photo upload took over 60 seconds. Check your connection and try again."], ["শিক্ষার্থীর তথ্য হালনাগাদ হয়েছে।", "Student details updated."],
  ["শিক্ষার্থী নির্বাচন করে সঠিক টাকার পরিমাণ দিন।", "Select a student and enter a valid amount."],
  ["জমার তথ্য সংরক্ষণ হচ্ছে...", "Saving payment..."], ["জমার তথ্য সংরক্ষণ হয়েছে।", "Payment saved."],
  ["জমার তথ্য সংরক্ষণ হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not save the payment. Check Firestore access rules."],
  ["প্রতিটি বিষয়ের প্রাপ্ত নম্বর শূন্য বা তার বেশি এবং পূর্ণমানের সমান/কম হতে হবে।", "Marks for each subject must be zero or greater and cannot exceed full marks."],
  ["শিক্ষার্থী, পরীক্ষার নাম ও সঠিক শিক্ষাবর্ষ নির্বাচন করুন।", "Select a student, exam name, and valid academic year."],
  ["ফলাফল সংরক্ষণ হচ্ছে...", "Saving results..."], ["ফলাফল সংরক্ষণ হয়েছে।", "Results saved."],
  ["ফলাফল সংরক্ষণ হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not save results. Check Firestore access rules."],
  ["ফলাফলটি মুছে ফেলতে চান?", "Delete this result?"], ["ফলাফল মুছে ফেলা হয়েছে।", "Result deleted."],
  ["কাজটি করা যায়নি। Firestore access rules পরীক্ষা করুন।", "The action failed. Check Firestore access rules."],
  ["তথ্য লোড হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not load data. Check Firestore access rules."],
  ["সম্পাদনা বাতিল করা হয়েছে।", "Editing cancelled."], ["নোটিশ লোড হয়নি। Firestore Rules পরীক্ষা করুন।", "Could not load notices. Check Firestore rules."],
  ["নোটিশের শিরোনাম লিখুন।", "Enter a notice title."], ["নোটিশের বিবরণ অথবা PDF লিংক দিন।", "Enter notice details or a PDF URL."],
  ["PDF-এর লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে।", "The PDF URL must start with https://."], ["সঠিক PDF লিংক দিন।", "Enter a valid PDF URL."],
  ["নোটিশ সংরক্ষণ হচ্ছে...", "Saving notice..."], ["নোটিশ সম্পাদনা করে সংরক্ষণ করা হয়েছে।", "Notice changes saved."],
  ["নতুন নোটিশ সংরক্ষণ করা হয়েছে।", "New notice saved."], ["সংরক্ষণ করা যায়নি। Firestore Rules ও সংযোগ পরীক্ষা করুন।", "Could not save. Check Firestore rules and your connection."],
  ["নোটিশটি খুঁজে পাওয়া যায়নি।", "Notice not found."], ["নোটিশ সম্পাদনা করুন, তারপর সংরক্ষণ চাপুন।", "Edit the notice, then select Save."],
  ["নোটিশের প্রকাশের অবস্থা পরিবর্তন হয়েছে।", "Notice publication status updated."], ["এই নোটিশটি স্থায়ীভাবে মুছে ফেলতে চান?", "Permanently delete this notice?"],
  ["নোটিশ মুছে ফেলা হয়েছে।", "Notice deleted."], ["কাজটি সম্পন্ন হয়নি। Firestore Rules পরীক্ষা করুন।", "The action failed. Check Firestore rules."],
  ["নতুন শিক্ষার্থী নিবন্ধিত হয়েছে। শিক্ষার্থী আইডি:", "New student registered. Student ID:"],
  ["অ্যাডমিন ড্যাশবোর্ড | TMNKSC", "Admin Dashboard | TMNKSC"],
  ["ট্রেড নির্বাচন করুন", "Select a trade"],
  ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস", "IT Support and IoT Basics"],
  ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "Apparel Manufacturing Basics"],
  ["জেনারেল মেকানিক্স", "General Mechanics"], ["জেনারেল ইলেক্ট্রনিক্স", "General Electronics"],
  ["এগ্রো বেসড ফুড", "Agro-Based Food"], ["কম্পিউটারাইজড একাউন্টিং সিস্টেম", "Computerized Accounting System"],
  ["ডিজিটাল টেকনোলজি ইন বিজনেস", "Digital Technology in Business"],
  ["যেমন: পরীক্ষার সময়সূচি", "For example: Exam Schedule"], ["নোটিশের বিস্তারিত লিখুন", "Enter notice details"],
  ["যেমন: 2026-27", "For example: 2026-27"], ["যেমন: নবম / একাদশ (একটি লিখুন)", "For example: Class 9 / Class 11 (enter one)"],
  ["যেমন: 001", "For example: 001"], ["যেমন: অর্ধবার্ষিক পরীক্ষা", "For example: Half-Yearly Examination"],
  ["নবম শ্রেণি", "Class 9"], ["দশম শ্রেণি", "Class 10"], ["একাদশ শ্রেণি", "Class 11"], ["দ্বাদশ শ্রেণি", "Class 12"],
  ["নবম", "Class 9"], ["দশম", "Class 10"], ["একাদশ", "Class 11"], ["দ্বাদশ", "Class 12"],
  ["ষষ্ঠ", "Class 6"], ["সপ্তম", "Class 7"], ["অষ্টম", "Class 8"],
  ["ফলাফল সংরক্ষণ হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not save results. Check Firestore access rules."],
  ["এই সেশন, শ্রেণি, ট্রেড ও রোলের আইডি আগে থেকেই আছে।", "An ID for this session, class, trade, and roll already exists."],
  ["নতুন শিক্ষার্থী নিবন্ধিত হয়েছে। শিক্ষার্থী আইডি:", "New student registered. Student ID:"],
  ["এই ফলাফলটি মুছে ফেলতে চান?", "Delete this result?"],
  ["এই নোটিশটি স্থায়ীভাবে মুছে ফেলতে চান?", "Permanently delete this notice?"],
  ["সঠিক PDF লিংক দিন।", "Enter a valid PDF URL."],
  ["Firestore access rules পরীক্ষা করুন।", "Check Firestore access rules."]
];

const bnToEn = new Map(pairs);
const enToBn = new Map(pairs.map(([bn, en]) => [en, bn]));
const translatableAttributes = ["placeholder", "aria-label", "title", "alt"];
const toggle = document.getElementById("dashboardLanguageToggle");
let currentLanguage = localStorage.getItem("dashboardLanguage") === "en" ? "en" : "bn";

function translateValue(value, language) {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const core = value.slice(leading.length, value.length - trailing.length || undefined);
  const dictionary = language === "en" ? bnToEn : enToBn;
  let translated = dictionary.get(core);

  if (!translated && language === "en") {
    const loadError = core.match(/^(শিক্ষার্থী|বেতন|ফলাফল) তথ্য লোড হয়নি। Firebase error: (.+)$/);
    if (loadError) {
      const section = { "শিক্ষার্থী": "Student", "বেতন": "Fee", "ফলাফল": "Result" }[loadError[1]];
      translated = `${section} data could not load. Firebase error: ${loadError[2]}`;
    }
    const uploadProgress = core.match(/^ছবি আপলোড হচ্ছে\.\.\. (\d+)%$/);
    if (!translated && uploadProgress) translated = `Uploading photo... ${uploadProgress[1]}%`;
    const registeredMatch = core.match(/^নতুন শিক্ষার্থী নিবন্ধিত হয়েছে। রোল: (.+)। শিক্ষার্থী আইডি: (.+)$/);
    if (!translated && registeredMatch) translated = `New student registered. Roll: ${registeredMatch[1]}. Student ID: ${registeredMatch[2]}`;
    const match = core.match(/^নতুন শিক্ষার্থী নিবন্ধিত হয়েছে। শিক্ষার্থী আইডি: (.+)$/);
    if (!translated && match) translated = `New student registered. Student ID: ${match[1]}`;
  } else if (!translated && language === "bn") {
    const loadError = core.match(/^(Student|Fee|Result) data could not load\. Firebase error: (.+)$/);
    if (loadError) {
      const section = { Student: "শিক্ষার্থী", Fee: "বেতন", Result: "ফলাফল" }[loadError[1]];
      translated = `${section} তথ্য লোড হয়নি। Firebase error: ${loadError[2]}`;
    }
    const uploadProgress = core.match(/^Uploading photo\.\.\. (\d+)%$/);
    if (!translated && uploadProgress) translated = `ছবি আপলোড হচ্ছে... ${uploadProgress[1]}%`;
    const registeredMatch = core.match(/^New student registered\. Roll: (.+)\. Student ID: (.+)$/);
    if (!translated && registeredMatch) translated = `নতুন শিক্ষার্থী নিবন্ধিত হয়েছে। রোল: ${registeredMatch[1]}। শিক্ষার্থী আইডি: ${registeredMatch[2]}`;
    const match = core.match(/^New student registered\. Student ID: (.+)$/);
    if (!translated && match) translated = `নতুন শিক্ষার্থী নিবন্ধিত হয়েছে। শিক্ষার্থী আইডি: ${match[1]}`;
  }

  return translated ? `${leading}${translated}${trailing}` : value;
}

function translateNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (parent && !parent.closest("script, style, .admin-profile")) {
      const translatedValue = translateValue(node.nodeValue, currentLanguage);
      if (translatedValue !== node.nodeValue) node.nodeValue = translatedValue;
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE && node !== document) return;
  const translateAttributes = (element) => {
    for (const attribute of translatableAttributes) {
      if (element.hasAttribute(attribute)) {
        const currentValue = element.getAttribute(attribute);
        const translatedValue = translateValue(currentValue, currentLanguage);
        if (translatedValue !== currentValue) element.setAttribute(attribute, translatedValue);
      }
    }
  };

  if (node.nodeType === Node.ELEMENT_NODE) translateAttributes(node);

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current.nodeType === Node.TEXT_NODE) {
      const parent = current.parentElement;
      if (parent && !parent.closest("script, style, .admin-profile")) {
        const translatedValue = translateValue(current.nodeValue, currentLanguage);
        if (translatedValue !== current.nodeValue) current.nodeValue = translatedValue;
      }
    } else {
      translateAttributes(current);
    }
  }
}

function applyLanguage(language) {
  currentLanguage = language;
  localStorage.setItem("dashboardLanguage", language);
  document.documentElement.lang = language;
  document.title = translateValue("অ্যাডমিন ড্যাশবোর্ড | TMNKSC", language);
  translateNode(document);
  toggle.textContent = language === "bn" ? "English" : "বাংলা";
  toggle.setAttribute("aria-label", language === "bn" ? "Switch dashboard language" : "ভাষা পরিবর্তন করুন");
  document.dispatchEvent(new CustomEvent("dashboard-language-change", { detail: { language } }));
}

window.dashboardTranslate = (text) => translateValue(text, currentLanguage);

toggle.addEventListener("click", () => applyLanguage(currentLanguage === "bn" ? "en" : "bn"));

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "characterData") translateNode(mutation.target);
    if (mutation.type === "attributes") translateNode(mutation.target);
    for (const node of mutation.addedNodes || []) translateNode(node);
  }
});

observer.observe(document.body, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: translatableAttributes
});

applyLanguage(currentLanguage);
