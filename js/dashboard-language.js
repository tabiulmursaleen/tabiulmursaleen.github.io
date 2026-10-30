const pairs = [
  ["অ্যাডমিন ড্যাশবোর্ড", "Admin Dashboard"],
  ["তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ", "Tabiul Mursaleen Nogor Karigori School & College"],
  ["অ্যাডমিন মেনু", "Admin menu"],
  ["বাম পাশের মেনু থেকে একটি বিভাগ বেছে নিন।", "Select a section from the menu on the left."],
  ["বেতন", "Fees"], ["অ্যাকাউন্টস", "Accounts"], ["ফলাফল", "Results"], ["নোটিশ", "Notices"], ["রুটিন", "Routine"],
  ["এডমিট কার্ড", "Admit Card"], ["পরীক্ষা", "Exams"], ["গ্যালারি", "Gallery"],
  ["মেনু গুটান", "Collapse menu"], ["মেনু খুলুন", "Expand menu"],
  ["সাইড মেনু গুটান", "Collapse side menu"], ["সাইড মেনু খুলুন", "Expand side menu"],
  ["এডিট প্রোফাইল", "Edit Profile"], ["লগআউট", "Log Out"],
  ["অ্যাডমিন প্রোফাইল সম্পাদনা", "Edit Admin Profile"], ["নাম", "Name"],
  ["প্রোফাইল ছবির লিংক", "Profile Photo URL"],
  ["Google Drive-এর ছবি হলে শেয়ার সেটিং “Anyone with the link” করে লিংক দিন।", "For a Google Drive photo, enable “Anyone with the link” and paste its URL."],
  ["ইংরেজি অক্ষরে লিখুন।", "Enter text using English characters only."],
  ["বাতিল", "Cancel"], ["সংরক্ষণ", "Save"], ["স্বাগতম, অ্যাডমিন!", "Welcome, Admin!"],
  ["শিক্ষার্থী নিবন্ধন", "Student Registration"], ["শিক্ষার্থীর তথ্য সংরক্ষণ ও তালিকা পরিচালনা করুন।", "Save student details and manage the student list."],
  ["অতিরিক্ত তথ্য (ঐচ্ছিক)", "Additional Information (Optional)"], ["শিক্ষার্থীর ধরন", "Student Type"],
  ["সেশন (পূর্বের/বোর্ড সেশন)", "Session (Previous/Board Session)"], ["বিষয় কোড", "Subject Codes"],
  ["মূল Excel-এর ট্রেডের নাম", "Trade Name from Source Excel"], ["যেমন: ২০২২ বা ২০২২-২০২৩", "For example: 2022 or 2022-2023"],
  ["যেমন: 21811, 21812, 21813", "For example: 21811, 21812, 21813"], ["ঐচ্ছিক", "Optional"],
  ["Excel থেকে শিক্ষার্থী তথ্য আমদানি", "Import Student Data from Excel"],
  ["প্রস্তুত করা roster JSON নির্বাচন করে শিক্ষার্থী, বোর্ড রোল/রেজিস্ট্রেশন ও অতিরিক্ত তথ্য ডাটাবেজে যোগ করুন। আমদানি হওয়া শিক্ষার্থীরা শুরুতে ওয়েবসাইটে প্রকাশিত হবে না। অনুপস্থিত তথ্য ফাঁকা থাকবে।", "Select the prepared roster JSON to add students, board roll/registration, and additional data to the database. Imported students will remain unpublished initially. Missing information will stay blank."],
  ["আমদানি ফাইল (.json)", "Import File (.json)"], ["ডাটাবেজে শিক্ষার্থী আমদানি", "Import Students into Database"],
  ["আমদানি করা শিক্ষার্থীদের প্রকাশ / হালনাগাদ করুন", "Publish / Update Imported Students"],
  ["শিক্ষার্থীর নমুনা ছবি", "Default student illustration"],
  ["মুছুন", "Delete"],
  ["বেতন ব্যবস্থাপনা", "Fee Management"], ["মাসিক বেতন ও অন্যান্য ফি আদায়ের হিসাব রাখুন।", "Record monthly tuition and other fee payments."],
  ["ফলাফল ব্যবস্থাপনা", "Result Management"], ["বিষয়ভিত্তিক নম্বর ও প্রকাশিত ফলাফল পরিচালনা করুন।", "Manage subject marks and published results."],
  ["নোটিশ ব্যবস্থাপনা", "Notice Management"], ["নোটিশ যোগ, সম্পাদনা ও প্রকাশ করুন।", "Add, edit, and publish notices."],
  ["রুটিন ব্যবস্থাপনা", "Routine Management"], ["ক্লাস ও পরীক্ষার রুটিন পরিচালনা করুন।", "Manage class and exam routines."],
  ["পরীক্ষার রুটিন", "Exam Routine"], ["পরীক্ষার রুটিন ব্যবস্থাপনা", "Exam Routine Management"],
  ["কমিটি, শিক্ষক ও কর্মচারী", "Committee, Teachers, and Staff"], ["ম্যানেজিং কমিটি, শিক্ষকমণ্ডলী ও কর্মচারীবৃন্দ", "Managing Committee, Teachers, and Staff"],
  ["ম্যানেজিং কমিটির সম্মানিত সদস্যগণ", "Honorable Managing Committee Members"], ["শিক্ষকমণ্ডলী", "Teachers"], ["কর্মচারীবৃন্দ", "Staff Members"],
  ["তিনটি আলাদা বিভাগ থেকে পরিচিতি, ছবি ও প্রোফাইলের তথ্য সম্পাদনা করুন। Google Drive-এর ছবি “Anyone with the link” হিসেবে শেয়ার করুন।", "Edit profiles, photos, and details in three separate sections. Share Google Drive photos with “Anyone with the link” access."],
  ["নতুন কমিটি সদস্য", "New Committee Member"], ["নতুন শিক্ষক", "New Teacher"], ["নতুন কর্মচারী", "New Staff Member"],
  ["কমিটি সদস্য তালিকা", "Committee Member List"], ["শিক্ষক তালিকা", "Teacher List"], ["কর্মচারী তালিকা", "Staff List"],
  ["পদবি / দায়িত্ব", "Designation / Role"], ["বিষয় / ট্রেড", "Subject / Trade"], ["ইনডেক্স নম্বর", "Index Number"],
  ["শিক্ষাগত যোগ্যতা", "Educational Qualification"], ["যোগদানের তারিখ", "Joining Date"], ["জন্মতারিখ", "Date of Birth"],
  ["মোবাইল নম্বর", "Mobile Number"], ["ইমেইল", "Email"], ["ছবির URL / Google Drive লিংক", "Photo URL / Google Drive Link"],
  ["তথ্য সংরক্ষণ ও প্রকাশ", "Save and Publish"], ["নতুন তথ্য", "New Entry"], ["তথ্য সংরক্ষণ ও প্রকাশ করা হয়েছে।", "Details saved and published."],
  ["এই তথ্যটি ওয়েবসাইট থেকে সরাবেন?", "Remove this profile from the website?"], ["তথ্যটি ওয়েবসাইট থেকে সরানো হয়েছে।", "Profile removed from the website."],
  ["এখনো কোনো তথ্য যোগ করা হয়নি।", "No information has been added yet."],
  ["ক্লাস কন্টেন্ট", "Class Content"], ["ক্লাস কন্টেন্ট ব্যবস্থাপনা", "Class Content Management"],
  ["পাঠ্যবই", "Textbooks"], ["পাঠ্যবই ব্যবস্থাপনা", "Textbook Management"],
  ["শ্রেণি নির্বাচন করে বিষয়গুলোর বইয়ের নাম ও PDF লিংক দিন। লিংক যোগ করে সংরক্ষণ করলে বইটি সাইটে দেখা যাবে। আপাতত নবম ও দশম শ্রেণির বিষয় তালিকা প্রস্তুত আছে।", "Select a class and enter a book title and PDF link for each subject. Books appear on the site after saving a PDF link. Subject lists are currently available for Classes 9 and 10."],
  ["শ্রেণি নির্বাচন করে বিষয়গুলোর বইয়ের নাম ও PDF লিংক দিন। লিংক যোগ করে সংরক্ষণ করলে বইটি সাইটে দেখা যাবে। একাদশ ও দ্বাদশ শ্রেণিতে নতুন বই ও বিষয় নিজে যোগ করুন। Google Drive ফাইলের শেয়ার অনুমতি “Anyone with the link — Viewer” করে দিন।", "Select a class and enter a book title and PDF link for each subject. Books appear on the site after saving a link. Add subjects and books for Classes 11 and 12 below. Set Google Drive access to “Anyone with the link — Viewer.”"],
  ["বিষয়ের নাম", "Subject name"], ["নতুন বিষয়ের নাম", "New subject name"], ["নতুন বই যোগ করুন", "Add new book"],
  ["PDF লিংক (ঐচ্ছিক)", "PDF link (optional)"], ["নতুন বই সংরক্ষিত হয়েছে। PDF লিংক যোগ করলে সাইটে দেখা যাবে।", "New book saved. It will appear on the site after adding a PDF link."],
  ["একাদশ শ্রেণির জন্য নতুন বই যোগ করুন।", "Add a new book for Class 11."], ["দ্বাদশ শ্রেণির জন্য নতুন বই যোগ করুন।", "Add a new book for Class 12."],
  ["শ্রেণি ও ট্রেড অনুযায়ী পাঠ্যবইয়ের নাম ও PDF লিংক যোগ করুন। আপাতত নবম ও দশম শ্রেণির বিষয় তালিকা প্রস্তুত আছে।", "Add textbook titles and PDF links by class and trade. Subject lists are currently available for Classes 9 and 10."],
  ["শ্রেণি নির্বাচন করুন", "Select a class"], ["বইয়ের নাম", "Book title"], ["PDF লিংক", "PDF link"],
  ["বইয়ের নাম লিখুন", "Enter a book title"], ["লিংক যোগ হয়নি", "No link added"], ["প্রকাশিত", "Published"],
  ["সংরক্ষণ হচ্ছে…", "Saving…"], ["প্রকাশিত", "Published"], ["সংরক্ষণ হয়নি", "Not saved"],
  ["বইয়ের তথ্য সংরক্ষণ ও প্রকাশ করা হয়েছে।", "Book details saved and published."],
  ["বইয়ের নাম সংরক্ষিত হয়েছে। PDF লিংক দিলে সাইটে দেখা যাবে।", "Book title saved. It will appear on the site after adding a PDF link."],
  ["সঠিক https:// PDF লিংক দিন।", "Enter a valid https:// PDF link."],
  ["বইয়ের নাম লিখুন।", "Enter a book title."], ["পাঠ্যবই লোড হয়নি। Firestore Rules পরীক্ষা করুন।", "Textbooks could not load. Check Firestore Rules."],
  ["পাঠ্যবই সংরক্ষণ হয়নি। Firestore Rules প্রকাশ ও প্রবেশাধিকার পরীক্ষা করুন।", "Textbook could not be saved. Publish the Firestore Rules and check access."],
  ["প্রতিটি বিষয়ের বইয়ের নাম ও PDF লিংক আলাদাভাবে সংরক্ষণ করুন।", "Save a book title and PDF link separately for each subject."],
  ["অ্যাডমিন হিসেবে প্রবেশ করুন।", "Sign in as administrator."],
  ["Google Drive-এ ফাইলটি “Anyone with the link — Viewer” করে লিংক দিন। শ্রেণি, বিষয় ও শিক্ষক উল্লেখ করে প্রকাশ করুন।", "Set the Drive file to “Anyone with the link — Viewer”. Add its class, subject, and teacher before publishing."],
  ["শাখা", "Branch"], ["স্কুল", "School"], ["কলেজ", "College"], ["বিষয়", "Subject"], ["শিক্ষকের নাম", "Teacher Name"],
  ["কন্টেন্টের শিরোনাম", "Content Title"], ["বর্ণনা", "Description"], ["Google Drive ফাইল লিংক", "Google Drive File Link"],
  ["ওয়েবসাইটে প্রকাশ করুন", "Publish on Website"], ["কন্টেন্ট সংরক্ষণ", "Save Content"], ["ফাঁকা করুন", "Clear Form"],
  ["সংরক্ষিত কন্টেন্ট", "Saved Content"], ["অবস্থা", "Status"], ["এখনো কোনো কন্টেন্ট নেই।", "No content has been added yet."],
  ["গ্যালারি ব্যবস্থাপনা", "Gallery Management"], ["ছবি", "Photo"], ["ভিডিও", "Video"],
  ["ছবি Google Drive-এ সবার দেখার অনুমতি দিয়ে শেয়ার করুন। ভিডিওর জন্য YouTube লিংক দিন।", "Share Google Drive photos so anyone can view them. Use YouTube links for videos."],
  ["Google Drive ছবির লিংক", "Google Drive Photo Link"], ["YouTube ভিডিও লিংক", "YouTube Video Link"], ["ক্যাপশন", "Caption"],
  ["লিংক দিলে এখানে প্রিভিউ দেখা যাবে", "A preview will appear here when you enter a link."], ["সঠিক Google Drive ছবির লিংক দিন", "Enter a valid Google Drive photo link."],
  ["সঠিক YouTube লিংক দিলে প্রিভিউ দেখা যাবে", "Enter a valid YouTube link to see its preview."], ["ছবির প্রিভিউ", "Photo preview"], ["ভিডিওর প্রিভিউ", "Video preview"],
  ["ছবি লোড হয়নি—Drive sharing সেটিং পরীক্ষা করুন", "Photo could not load. Check the Drive sharing settings."], ["ভিডিওর থাম্বনেইল লোড হয়নি", "Video thumbnail could not load."],
  ["ছবির লিংক", "Photo link"], ["ভিডিওর লিংক", "Video link"], ["এই সারি বাদ দিন", "Remove this row"],
  ["Google Drive ছবির লিংক পেস্ট করুন", "Paste a Google Drive photo link"], ["YouTube ভিডিওর লিংক পেস্ট করুন", "Paste a YouTube video link"],
  ["+ আরেকটি ছবি যোগ করুন", "+ Add another photo"], ["+ আরেকটি ভিডিও যোগ করুন", "+ Add another video"],
  ["আরেকটি ছবি যোগ করুন", "Add another photo"], ["আরেকটি ভিডিও যোগ করুন", "Add another video"],
  ["টেনে অবস্থান বদলান", "Drag to reorder"], ["প্রিভিউ পাওয়া যায়নি", "Preview unavailable"],
  ["এই লিংক বাদ দিন", "Remove this link"],
  ["ক্যাপশন নেই", "No caption"], ["গ্যালারির ছবি", "Gallery photo"], ["ভিডিওর থাম্বনেইল", "Video thumbnail"],
  ["ক্যাপশন লিখুন", "Enter a caption"], ["ক্যাপশন সংরক্ষণ", "Save caption"], ["সেভ", "Save"], ["ক্যাপশন সংরক্ষিত হয়েছে।", "Caption saved."],
  ["ক্যাপশন সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", "Could not save caption. Check Firestore Rules."],
  ["গ্যালারির ধারাবাহিকতা সংরক্ষিত হয়েছে।", "Gallery order saved."], ["ধারাবাহিকতা সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", "Could not save the order. Check Firestore Rules."],
  ["গ্যালারির তথ্য সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", "Could not save gallery items. Check Firestore Rules."],
  ["ছবির সংক্ষিপ্ত বিবরণ", "Short photo caption"], ["ভিডিওর সংক্ষিপ্ত বিবরণ", "Short video caption"],
  ["গ্যালারিতে সংরক্ষণ", "Save to Gallery"], ["সংরক্ষিত ছবি", "Saved Photos"], ["সংরক্ষিত ভিডিও", "Saved Videos"],
  ["প্রিভিউ", "Preview"], ["ভিডিও", "Video"], ["এখনো কোনো মিডিয়া যোগ করা হয়নি।", "No media has been added yet."],
  ["গ্যালারি থেকে মুছে ফেলবেন?", "Remove this item from the gallery?"], ["সঠিক YouTube ভিডিও লিংক দিন।", "Enter a valid YouTube video link."],
  ["ছবির Google Drive লিংক দিন।", "Enter a Google Drive photo link."], ["Google Drive-এর শেয়ার লিংক দিন।", "Enter a Google Drive share link."],
  ["ছবির লিংক https:// দিয়ে শুরু হতে হবে।", "Photo links must begin with https://."], ["Google Drive লিংক https:// দিয়ে শুরু হতে হবে।", "Google Drive links must begin with https://."],
  ["ভিডিও লিংক https:// দিয়ে শুরু হতে হবে।", "Video links must begin with https://."], ["লিংক https:// দিয়ে শুরু হতে হবে।", "Links must begin with https://."],
  ["তথ্য লোড করা যায়নি। নতুন Firestore Rules প্রকাশ করুন।", "Could not load data. Publish the updated Firestore Rules."],
  ["প্রতিটি পরীক্ষা আলাদাভাবে তৈরি করুন। প্রতিষ্ঠানের নাম, ঠিকানা ও EIIN ওয়েবসাইটে স্বয়ংক্রিয়ভাবে দেখাবে।", "Create each exam schedule separately. The institution name, address, and EIIN appear automatically on the website."],
  ["শ্রেণি নির্বাচন করুন", "Select a class"], ["পরীক্ষার নাম", "Exam Name"], ["পরীক্ষা শুরুর সময়", "Exam Start Time"],
  ["যেমন: অর্ধবার্ষিক পরীক্ষা", "For example: Half-Yearly Examination"], ["পরীক্ষার সময়সূচি", "Exam Schedule"],
  ["+ বিষয় যোগ করুন", "+ Add Subject"], ["তারিখ", "Date"], ["বিষয়ের নাম", "Subject Name"], ["বিষয় কোড", "Subject Code"],
  ["রুটিন সংরক্ষণ ও প্রকাশ", "Save and Publish Routine"], ["পরিবর্তন সংরক্ষণ", "Save Changes"],
  ["সংরক্ষিত পরীক্ষার রুটিন", "Saved Exam Routines"], ["প্রকাশ", "Publication"], ["কাজ", "Actions"],
  ["প্রকাশিত", "Published"], ["অপ্রকাশিত", "Unpublished"], ["এডিট", "Edit"],
  ["এখনো কোনো পরীক্ষার রুটিন সংরক্ষণ করা হয়নি।", "No exam schedules have been saved yet."],
  ["রুটিন সম্পাদনা করুন, তারপর সংরক্ষণ চাপুন।", "Edit the schedule, then select Save."],
  ["অন্তত একটি বিষয়ের সারি রাখতে হবে।", "At least one subject row is required."],
  ["প্রতিটি সারিতে তারিখ, বিষয় ও বিষয় কোড পূরণ করুন।", "Enter a date, subject, and subject code in every row."],
  ["পরীক্ষার রুটিন সংরক্ষণ হচ্ছে...", "Saving exam routine..."],
  ["পরীক্ষার রুটিন সংরক্ষিত ও প্রকাশিত হয়েছে।", "Exam routine saved and published."],
  ["পরীক্ষার রুটিন সংরক্ষিত হয়েছে; প্রকাশ করতে প্রকাশের ঘরটি নির্বাচন করুন।", "Exam routine saved. Select Publish on Website to make it public."],
  ["পরীক্ষার রুটিন সংরক্ষণ হয়নি। Firestore Rules ও সংযোগ পরীক্ষা করুন।", "Could not save the exam routine. Check Firestore Rules and connection."],
  ["পরীক্ষার রুটিন লোড হচ্ছে...", "Loading exam routines..."],
  ["পরীক্ষার রুটিন লোড করা যায়নি। Firestore access rules পরীক্ষা করুন।", "Could not load exam routines. Check Firestore access rules."],
  ["এই পরীক্ষার রুটিনটি মুছে ফেলতে চান?", "Delete this exam routine?"],
  ["রুটিন মুছে ফেলা হয়েছে।", "Routine deleted."],
  ["রুটিন মুছতে সমস্যা হয়েছে। Firestore Rules পরীক্ষা করুন।", "Could not delete the routine. Check Firestore Rules."],
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
  ["নোটিশ সংরক্ষণ", "Save Notice"], ["এডিট বাতিল", "Cancel Edit"], ["সংরক্ষিত নোটিশসমূহ", "Saved Notices"],
  ["নোটিশ লোড হচ্ছে...", "Loading notices..."],
  ["শিক্ষার্থী আইডি", "Student ID"], ["সেভের পর তৈরি হবে", "Generated after saving"], ["সাবমিটের পর তৈরি হবে", "Generated after submission"],
  ["সাবমিটের পর স্বয়ংক্রিয়ভাবে তৈরি হবে।", "Generated automatically after submission."],
  ["ট্রেড নির্বাচন করুন", "Select a trade"],
  ["শিক্ষার্থীর নাম", "Student Name"], ["শাখা", "Branch"],
  ["শাখা নির্বাচন করুন", "Select a branch"], ["স্কুল", "School"], ["কলেজ", "College"],
  ["বোর্ড রেজিস্ট্রেশন তথ্য", "Board Registration Details"], ["বোর্ডের তথ্য দিন", "Enter Board Details"], ["বোর্ড রোল", "Board Roll"], ["বোর্ড রেজি. নম্বর", "Board Registration No."],
  ["শিক্ষার্থীর নাম (ইংরেজি)", "Student Name (English)"], ["শিক্ষার্থীর নাম (বাংলা)", "Student Name (Bangla)"],
  ["পিতার নাম (ইংরেজি)", "Father's Name (English)"], ["পিতার নাম (বাংলা)", "Father's Name (Bangla)"],
  ["মাতার নাম (ইংরেজি)", "Mother's Name (English)"], ["মাতার নাম (বাংলা)", "Mother's Name (Bangla)"], ["বাংলা বানান", "Bangla spelling"],
  ["ইংরেজিতে লিখুন", "Enter in English"], ["বাংলায় লিখুন", "Enter in Bangla"],
  ["ইংরেজি অক্ষরে লিখুন।", "Enter using English letters."], ["বাংলা অক্ষরে লিখুন।", "Enter using Bangla letters."],
  ["জন্মনিবন্ধনের বানান অনুযায়ী ইংরেজি অক্ষরে লিখুন।", "Enter in English using the spelling on the birth registration certificate."],
  ["জন্মনিবন্ধনের বানান অনুযায়ী বাংলা অক্ষরে লিখুন।", "Enter in Bangla using the spelling on the birth registration certificate."],
  ["পূর্ববর্তী বোর্ড/সমমানের পরীক্ষা", "Previous Board/Equivalent Examination"], ["পরীক্ষা নির্বাচন করুন (প্রযোজ্য না হলে ফাঁকা রাখুন)", "Select an exam (leave blank if not applicable)"],
  ["প্রাথমিক শিক্ষা সমাপনী (PSC)", "Primary Education Completion (PSC)"], ["ইবতেদায়ী সমাপনী", "Ebtedayee Completion"], ["জুনিয়র স্কুল সার্টিফিকেট (JSC)", "Junior School Certificate (JSC)"], ["জুনিয়র দাখিল সার্টিফিকেট (JDC)", "Junior Dakhil Certificate (JDC)"], ["এসএসসি (SSC)", "SSC"], ["দাখিল", "Dakhil"], ["এসএসসি (ভোকেশনাল)", "SSC (Vocational)"], ["অন্যান্য সমমানের পরীক্ষা", "Other Equivalent Examination"],
  ["রোল নম্বর", "Roll Number"], ["জিপিএ", "GPA"], ["রেজিস্ট্রেশন নম্বর", "Registration Number"], ["সেশন", "Session"], ["পাশের সন", "Passing Year"], ["যেমন: ২০২২-২০২৩", "Example: 2022-2023"],
  ["শ্রেণি", "Class"], ["শ্রেণি নির্বাচন করুন", "Select a class"], ["ট্রেড", "Trade"],
  ["প্রতিষ্ঠানের ট্রেডের নাম লিখুন", "Enter or select an institutional trade"], ["রোল নম্বর", "Roll Number"],
  ["জন্মতারিখ", "Date of Birth"], ["লিঙ্গ", "Gender"], ["নির্বাচন করুন", "Select"], ["ছাত্র", "Male"], ["ছাত্রী", "Female"], ["অন্যান্য", "Other"], ["ভর্তির তারিখ", "Admission Date"], ["পিতার নাম", "Father's Name"], ["মাতার নাম", "Mother's Name"],
  ["জন্মনিবন্ধন সনদে যেভাবে বানান লেখা আছে, পিতার ও মাতার নাম ঠিক সেভাবেই লিখুন।", "Enter both parents' names exactly as spelled on the birth registration certificate."],
  ["জন্মনিবন্ধন অনুযায়ী", "As on birth certificate"],
  ["অভিভাবকের মোবাইল", "Guardian Phone"], ["জরুরি যোগাযোগের নম্বর", "Emergency Contact Number"], ["ছবির Google Drive লিংক", "Student Photo Google Drive Link"], ["Drive-এ JPG ছবি আপলোড করে “Anyone with the link — Viewer” করুন। ৫০০ কেবির নিচে রাখুন।", "Upload a JPG photo to Drive and set access to “Anyone with the link — Viewer”. Keep it under 500 KB."], ["শিক্ষার্থীর ছবির Google Drive লিংক দিন।", "Enter the student's Google Drive photo link."], ["সঠিক Google Drive শেয়ার লিংক দিন।", "Enter a valid Google Drive sharing link."], ["ছবির লিংক https:// দিয়ে শুরু হতে হবে।", "The photo link must start with https://."], ["Google Drive-এর শেয়ার লিংক ব্যবহার করুন।", "Use a Google Drive sharing link."], ["Drive লিংকটি থেকে ছবির আইডি পাওয়া যায়নি। Copy link দিয়ে আবার চেষ্টা করুন।", "Could not find the image ID in that Drive link. Copy the sharing link and try again."], ["গ্রাম", "Village"], ["উপজেলা", "Upazila"], ["জেলা", "District"],
  ["শিক্ষার্থী তালিকায় প্রকাশ করুন (নাম, আইডি, শিক্ষাবর্ষ, শাখা, শ্রেণি, ট্রেড, রোল ও ছবি প্রকাশ হবে)", "Publish in the student directory (name, ID, academic year, branch, class, trade, roll, and photo will be visible)"],
  ["শিক্ষার্থী সংরক্ষণ", "Save Student"], ["পরিবর্তন সংরক্ষণ", "Save Changes"], ["নিবন্ধিত শিক্ষার্থী", "Registered Students"],
  ["আইডি", "ID"], ["নাম", "Name"], ["শাখা / শ্রেণি", "Branch / Class"], ["রোল", "Roll"], ["ওয়েবসাইটে", "On Website"], ["কাজ", "Actions"],
  ["বেতন ও ফি আদায়", "Tuition and Fee Collection"], ["শ্রেণি ও ট্রেড বেছে রোলের ক্রমে একাধিক শিক্ষার্থী নির্বাচন করে একসঙ্গে জমা সংরক্ষণ করুন। প্রত্যেকের জন্য আলাদা রসিদ তৈরি হবে।", "Choose a class and trade, select multiple students in roll order, and save their payments together. A separate receipt will be generated for each student."],
  ["অ্যাকাউন্টস", "Accounts"], ["বেতন ও ফি আদায়, ধরনভিত্তিক মোট আদায় এবং প্রতিষ্ঠানের খরচের হিসাব এক জায়গায় দেখুন।", "Review tuition and fee receipts, totals by fee type, and institutional expenses in one place."],
  ["বেতন স্প্রেডশিট", "Tuition Spreadsheet"], ["ধরনভিত্তিক আদায়", "Receipts by Fee Type"], ["প্রতিষ্ঠানের খরচ", "Institution Expenses"],
  ["শ্রেণী ও ট্রেডভিত্তিক বেতন স্প্রেডশিট", "Class and Trade Tuition Spreadsheet"], ["সব শিক্ষার্থীর মাসভিত্তিক জমা ও মোট গৃহীত অর্থ দেখুন; শ্রেণি ও ট্রেড দিয়ে তালিকা সংকুচিত করুন।", "View monthly payments and total receipts for all students; narrow the list by class and trade."], ["সর্বমোট গৃহীত অর্থ", "Total Amount Received"],
  ["পরিশোধের মাধ্যম", "Payment Method"], ["সব মাধ্যম", "All Methods"], ["All payment methods", "All payment methods"], ["ধরনভিত্তিক আদায়", "Receipts by Fee Type"], ["ফি-এর ধরনভিত্তিক আদায়", "Receipts by Fee Type"], ["লেনদেন সংখ্যা", "Transactions"], ["মোট আদায়", "Total Received"], ["আদায় তালিকা প্রিন্ট", "Print Receipt Summary"], ["খরচ তালিকা প্রিন্ট", "Print Expense List"], ["এই ফিল্টারে কোনো আদায়ের তথ্য নেই।", "No receipts match these filters."],
  ["শুরু", "From"], ["শেষ", "To"], ["শ্রেণি", "Class"], ["ট্রেড", "Trade"], ["সব শ্রেণি", "All Classes"], ["সব ট্রেড", "All Trades"], ["ফিল্টার মুছুন", "Clear Filters"],
  ["প্রতিষ্ঠানের খরচের বিবরণ", "Institution Expense Details"], ["খরচের ধরন", "Expense Category"], ["ধরন নির্বাচন করুন", "Select a category"], ["খরচের তারিখ", "Expense Date"], ["বিবরণ", "Description"], ["খরচ সংরক্ষণ", "Save Expense"], ["খরচের তথ্য সংরক্ষণ হচ্ছে...", "Saving expense..."], ["খরচের তথ্য সংরক্ষিত হয়েছে।", "Expense saved."], ["খরচ সংরক্ষণ করা যায়নি। Firestore Rules পরীক্ষা করুন।", "Could not save expense. Check Firestore Rules."], ["মোট খরচ", "Total Expenses"], ["এই ফিল্টারে কোনো খরচের তথ্য নেই।", "No expenses match these filters."], ["ভাউচার / রেফারেন্স (ঐচ্ছিক)", "Voucher / Reference (Optional)"], ["ভাউচার", "Voucher"], ["সব ধরন", "All Categories"],
  ["শিক্ষক-কর্মচারীর বেতন/ভাতা", "Teacher and Staff Salary/Benefits"], ["বিদ্যুৎ ও ইউটিলিটি", "Electricity and Utilities"], ["শিক্ষা উপকরণ", "Educational Supplies"], ["মেরামত ও রক্ষণাবেক্ষণ", "Repairs and Maintenance"], ["অফিস ও প্রশাসনিক", "Office and Administration"], ["যাতায়াত", "Transportation"],
  ["স্প্রেডশিট প্রিন্ট", "Print Spreadsheet"], ["এই শ্রেণি ও ট্রেডে কোনো শিক্ষার্থী নেই।", "No students found for this class and trade."], ["শিক্ষার্থীর নাম", "Student Name"], ["মোট জমা", "Annual Total"],
  ["শিক্ষার্থী নির্বাচন", "Select Students"], ["তালিকার সবাই", "Everyone in the list"], ["শ্রেণি, ট্রেড, অন্তত একজন শিক্ষার্থী ও সঠিক জমার তথ্য দিন।", "Choose a class, trade, at least one student, and valid payment details."],
  ["যে মাসগুলোর বেতন জমা হবে", "Months to Pay"], ["সব মাস", "Select All Months"], ["কোনো মাস নির্বাচিত নয়", "No months selected"], ["বেতনের বছর", "Tuition Year"], ["প্রতি মাসের পরিমাণ (টাকা)", "Amount per month (BDT)"], ["পরিমাণ (টাকা)", "Amount (BDT)"], ["প্রতি মাসের বেতনের পরিমাণ লিখুন; নির্বাচিত মাসের সংখ্যা অনুযায়ী মোট টাকা হিসাব হবে।", "Enter the tuition amount per month; the total is calculated from the number of months selected."], ["প্রতি মাসের টাকা × মাসসংখ্যা", "Monthly amount × number of months"], ["মাস", "Month"], ["মাসসমূহ", "Months"],
  ["শ্রেণি নির্বাচন করুন", "Select a class"], ["ট্রেড নির্বাচন করুন", "Select a trade"], ["আগে শ্রেণি নির্বাচন করুন", "Select a class first"], ["শ্রেণি ও ট্রেড নির্বাচন করুন।", "Choose a class and trade."], ["এই শ্রেণি ও ট্রেডে কোনো শিক্ষার্থী পাওয়া যায়নি।", "No students found for this class and trade."],
  ["এই ফিল্টারে কোনো জমার তথ্য নেই।", "No payments match these filters."], ["শুরু", "From"], ["শেষ", "To"], ["সব শ্রেণি", "All Classes"], ["সব ট্রেড", "All Trades"], ["সব ধরন", "All Types"], ["ফিল্টার মুছুন", "Clear Filters"], ["তালিকা প্রিন্ট", "Print List"], ["শ্রেণি / ট্রেড", "Class / Trade"], ["রসিদ নম্বর", "Receipt Number"], ["রসিদ / প্রিন্ট", "Receipt / Print"],
  ["ফি-এর ধরন", "Fee Type"], ["নির্বাচন করুন", "Select"],
  ["মাসিক বেতন", "Monthly Tuition"], ["পরীক্ষার ফি", "Exam Fee"], ["ভর্তি ফি", "Admission Fee"], ["বোর্ড রেজিস্ট্রেশন ফি", "Board Registration Fee"], ["লেট ফাইন (টাকা)", "Late Fine (BDT)"], ["অন্যান্য", "Other"],
  ["মাস (প্রযোজ্য হলে)", "Month (if applicable)"], ["পরিমাণ (টাকা)", "Amount (BDT)"], ["জমার তারিখ", "Payment Date"],
  ["পরিশোধের মাধ্যম", "Payment Method"], ["নগদ", "Cash"], ["মোবাইল ব্যাংকিং", "Mobile Banking"], ["ব্যাংক", "Bank"],
  ["রসিদ নম্বর", "Receipt Number"], ["মন্তব্য", "Notes"], ["জমা সংরক্ষণ", "Save Payment"], ["সাম্প্রতিক জমা", "Recent Payments"],
  ["তারিখ", "Date"], ["শিক্ষার্থী", "Student"], ["ফি", "Fee"], ["মাস", "Month"], ["টাকা", "Amount"], ["রসিদ", "Receipt"], ["বেতন ও ফি জমার তালিকা", "Payment Records"], ["বেতন ও ফি জমার রসিদ", "Tuition and Fee Receipt"], ["জমার রসিদ", "Payment Receipt"], ["শিক্ষার্থীর নাম", "Student Name"], ["শিক্ষার্থী আইডি", "Student ID"], ["জমার তারিখ", "Payment Date"], ["মূল জমা", "Base Amount"], ["মোট জমা", "Total Paid"], ["গ্রহণকারীর স্বাক্ষর", "Received By"], ["অনুমোদিত স্বাক্ষর", "Authorized Signature"], ["প্রিন্ট / PDF সংরক্ষণ", "Print / Save as PDF"], ["রসিদ খুলতে ব্রাউজারের পপ-আপ অনুমতি দিন।", "Allow pop-ups in your browser to open the receipt."],
  ["বিষয়ভিত্তিক নম্বর", "Subject Marks"], ["পরীক্ষার নাম", "Exam Name"], ["শিক্ষাবর্ষ", "Academic Year"],
  ["শ্রেণী ও ট্রেডভিত্তিক তালিকা থেকে প্রদর্শনের নিয়ম বেছে শিক্ষার্থী নির্বাচন করুন। প্রতি A4 পাতায় চারটি করে প্রবেশপত্র তৈরি হবে।", "Select a display rule for the chosen class and trade. Four admit cards will be generated per A4 page."],
  ["বেতন পরিশোধিত আছে যে মাস পর্যন্ত", "Tuition Paid Through"], ["মাস নির্বাচন করুন", "Select a month"],
  ["শিক্ষার্থী দেখানোর নিয়ম", "Student Display Rule"], ["নিয়ম নির্বাচন করুন", "Select a rule"],
  ["নির্বাচিত মাস পর্যন্ত বেতন পরিশোধ করেছে", "Paid tuition through the selected month"], ["পরীক্ষার ফি / ফরম ফিলাপ করেছে", "Paid exam fee / form fill-up fee"], ["নির্বাচিত শ্রেণি ও ট্রেডের সবাই", "Everyone in the selected class and trade"],
  ["যে ফি পরিশোধ হয়েছে", "Fee Paid"], ["পরীক্ষার ফি অথবা ফরম ফিলাপ", "Exam Fee or Form Fill-up"], ["শুধু পরীক্ষার ফি", "Exam Fee Only"], ["শুধু ফরম ফিলাপ", "Form Fill-up Only"],
  ["নির্বাচিত নিয়মে শিক্ষার্থী দেখুন", "Show Students by Selected Rule"], ["তালিকার সবাই নির্বাচন করুন", "Select Everyone in the List"], ["পরিশোধের অবস্থা", "Payment Status"],
  ["প্রদর্শন ভিত্তি", "Display Basis"], ["পরিশোধিত ফি", "Fee Paid"], ["শ্রেণি ও ট্রেডের সবাই", "Everyone in the selected class and trade"],
  ["এই শিক্ষাবর্ষে পরীক্ষার ফি / ফরম ফিলাপের জমা নেই", "No exam or form-fill-up payment found for this academic year"],
  ["শ্রেণি, পরীক্ষা, শিক্ষাবর্ষ এবং প্রদর্শনের নিয়ম নির্বাচন করুন।", "Select the class, exam, academic year, and display rule."],
  ["এই শ্রেণি ও ট্রেডে কোনো শিক্ষার্থী পাওয়া যায়নি।", "No students were found in this class and trade."],
  ["জানুয়ারি", "January"], ["ফেব্রুয়ারি", "February"], ["মার্চ", "March"], ["এপ্রিল", "April"], ["মে", "May"], ["জুন", "June"],
  ["জুলাই", "July"], ["আগস্ট", "August"], ["সেপ্টেম্বর", "September"], ["অক্টোবর", "October"], ["নভেম্বর", "November"], ["ডিসেম্বর", "December"],
  ["বেতন যাচাই করে শিক্ষার্থী দেখুন", "Check fees and list students"], ["সব যোগ্য শিক্ষার্থী নির্বাচন", "Select all eligible students"],
  ["প্রবেশপত্র তৈরি করুন", "Generate Admit Cards"], ["সিট প্ল্যান তৈরি করুন", "Generate Seat Plan"], ["হাজিরা শিট তৈরি করুন", "Generate Attendance Sheets"], ["হাজিরা শিটে প্রদর্শিত পরীক্ষার্থী তথ্য", "Candidate Details to Show on Attendance Sheet"], ["প্রকাশিত পরীক্ষার রুটিন", "Published Exam Routine"], ["রুটিন পেজের লিংক পেস্ট করুন", "Paste the exam routine page link"], ["রুটিন দেখুন", "Load Routine"], ["প্রকাশিত রুটিন পেজ খুলুন", "Open Published Routine"], ["শ্রেণি ও পরীক্ষা নির্বাচন করলে প্রকাশিত রুটিন এখানে দেখা যাবে।", "Select a class and exam to see its published routine here."], ["হাজিরা শিট প্রিন্ট / PDF সংরক্ষণ", "Print Attendance Sheet / Save PDF"], ["সিট প্ল্যানে প্রদর্শিত তথ্য", "Details to Show in Seat Plan"], ["ক্লাস রোল", "Class Roll"], ["ক্রমিক", "No."], ["সিট প্ল্যান", "Seat Plan"], ["সিট প্ল্যান প্রিন্ট / PDF সংরক্ষণ", "Print Seat Plan / Save PDF"], ["প্রিন্ট / PDF সংরক্ষণ", "Print / Save PDF"], ["নির্বাচন", "Select"], ["ছবি", "Photo"], ["বেতন যাচাই", "Fee Status"],
  ["সিট প্ল্যান তৈরির জন্য শিক্ষার্থী নির্বাচন করুন।", "Select students to create the seat plan."], ["সিট প্ল্যানে অন্তত একটি তথ্য নির্বাচন করুন।", "Select at least one detail for the seat plan."],
  ["হাজিরা শিট তৈরির জন্য পরীক্ষার্থী নির্বাচন করুন।", "Select candidates to create attendance sheets."], ["হাজিরা শিটে অন্তত একটি পরীক্ষার্থী তথ্য নির্বাচন করুন।", "Select at least one candidate detail for the attendance sheet."], ["প্রকাশিত পরীক্ষার রুটিন খোঁজা হচ্ছে...", "Loading the published exam routine..."], ["এই শ্রেণি ও পরীক্ষার কোনো প্রকাশিত পরীক্ষার রুটিন পাওয়া যায়নি। আগে পরীক্ষার রুটিন প্রকাশ করুন।", "No published exam routine was found for this class and exam. Publish the exam routine first."], ["পরীক্ষার রুটিন লোড করা যায়নি। Firestore access rules পরীক্ষা করুন।", "Could not load the exam routine. Check Firestore access rules."],
  ["শিক্ষার্থীর নাম", "Student Name"], ["শিক্ষার্থী আইডি", "Student ID"], ["পরীক্ষার প্রবেশপত্র", "Examination Admit Card"],
  ["পরীক্ষা", "Examination"], ["বেতন পরিশোধিত", "Tuition Paid"], ["প্রতিষ্ঠান প্রধানের স্বাক্ষর", "Head of Institution’s Signature"], ["প্রতিষ্ঠানের সীল", "Institution Seal"],
  ["যোগ্য", "Eligible"], ["বকেয়া", "Due"],
  ["এই শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি।", "No students were found in this class."],
  ["প্রবেশপত্র তৈরির জন্য যোগ্য শিক্ষার্থী নির্বাচন করুন।", "Select eligible students to generate admit cards."],
  ["প্রতিষ্ঠানের লোগো", "Institution logo"],
  ["আইডি / রোল", "ID / Roll"], ["যোগ্য শিক্ষার্থী", "Eligible Students"], ["পরীক্ষার প্রবেশপত্র", "Examination Admit Card"],
  ["টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা", "Tenguri, Kendua, Netrokona"],
  ["পরীক্ষা নির্বাচন করুন", "Select an exam"], ["অর্ধবার্ষিক", "Half-Yearly"], ["নির্বাচনী", "Selection Exam"], ["বার্ষিক", "Annual"], ["প্রাক-নির্বাচনী", "Pre-Selection"],
  ["শ্রেণি নির্বাচন করে বিষয় ও পূর্ণমান দিন। নম্বর দেওয়ার সময় বিষয় বেছে নিলে শুধু সেই বিষয়ের কলাম দেখা যাবে। রোলের পাশে “সব বিষয়ে অনুপস্থিত” দিলে পুরো পরীক্ষায় অনুপস্থিত হবে; বিষয় কলামের “অনুপস্থিতি” টিক দিলে শুধু সেই বিষয়েই অনুপস্থিত দেখাবে।", "Select a class, subjects, and full marks. Choose a subject to show only its mark columns. Mark “Absent in all subjects” beside a roll for whole-exam absence, or mark “Absence” in a subject column to record absence only for that subject."],
  ["বিষয় নির্বাচন ও পূর্ণমান", "Select Subjects and Full Marks"], ["শ্রেণি নির্বাচন করলে বিষয়গুলো দেখাবে।", "Subjects will appear after selecting a class."],
  ["বিষয় নির্বাচন করলে বিষয় কোড নিজে থেকে বসবে।", "Selecting a subject will fill its subject code automatically."], ["এই শ্রেণির বিষয় তালিকা এখনো যোগ করা হয়নি।", "The subject list for this class has not been added yet."],
  ["এই শ্রেণির রুটিনে কোনো বিষয় পাওয়া যায়নি।", "No subjects were found in this class timetable."],
  ["তাত্ত্বিক পূর্ণমান", "Theory Full Marks"], ["ব্যবহারিক পূর্ণমান", "Practical Full Marks"],
  ["ব্যবহারিক পূর্ণমান (ঐচ্ছিক)", "Practical Full Marks (Optional)"], ["তাত্ত্বিক পাশ নম্বর (ঐচ্ছিক)", "Theory Pass Marks (Optional)"], ["ব্যবহারিক পাশ নম্বর (ঐচ্ছিক)", "Practical Pass Marks (Optional)"],
  ["রোলের ধরন", "Roll Type"], ["রোল নির্বাচন করুন", "Select a roll type"], ["বোর্ড রোল", "Board Roll"], ["শ্রেণি রোল", "Class Roll"],
  ["বিষয়", "Subject"], ["বিষয় নির্বাচন করুন", "Select a subject"], ["+ বিষয় যোগ করুন", "+ Add Subject"], ["সরান", "Remove"],
  ["রোলসহ ছক তৈরি করুন", "Create Roll Mark Sheet"], ["রোল অনুযায়ী নম্বর", "Marks by Roll"], ["বিষয় / নম্বরের ধরন", "Subject / Mark Type"], ["তাত্ত্বিক", "Theory"], ["ব্যবহারিক", "Practical"],
  ["রোল", "Roll"], ["নম্বরের খসড়া স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে।", "Marks draft saved automatically."],
  ["এই শ্রেণির শিক্ষার্থীদের বোর্ড রোল যোগ করা নেই। আগে শিক্ষার্থী নিবন্ধনে বোর্ড রোল দিন।", "Board rolls are missing for students in this class. Add them in Student Registration first."],
  ["শ্রেণি, বিষয় ও রোলের ধরন নির্বাচন করুন।", "Select a class, subjects, and roll type."], ["শ্রেণি, পরীক্ষা, বিষয় ও রোলের ছক তৈরি করুন।", "Select the class, exam, subjects, and create the roll sheet."],
  ["শ্রেণি নির্বাচন করুন।", "Select a class."], ["বোর্ড রোল অথবা শ্রেণি রোল নির্বাচন করুন।", "Select Board Roll or Class Roll."], ["কমপক্ষে একটি বিষয় নির্বাচন করুন।", "Select at least one subject."],
  ["এই শ্রেণিতে কোনো নিবন্ধিত শিক্ষার্থী পাওয়া যায়নি। শিক্ষার্থীর শ্রেণির তথ্য মিলিয়ে দেখুন।", "No registered students were found in this class. Check the class information in student records."],
  ["প্রতিটি বিষয়ের পূর্ণমান দিন এবং প্রাপ্ত নম্বর পূর্ণমানের মধ্যে রাখুন।", "Enter full marks for each subject and keep obtained marks within the full marks."],
  ["শ্রেণির ফলাফল সংরক্ষণ হচ্ছে...", "Saving class results..."], ["শ্রেণির ফলাফল সংরক্ষণ হয়েছে।", "Class results saved."],
  ["ফলাফল সংরক্ষণ হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not save results. Check Firestore access rules."],
  ["প্রকাশিত ফলে ব্যবহারিক নম্বর দেখান", "Show practical marks in published results"], ["এই শিক্ষার্থীর নম্বর সেভ", "Save this student's marks"],
  ["একক ফলে যে পরিচিতি তথ্য দেখাবেন", "Details to show on individual results"], ["শিক্ষার্থী আইডি", "Student ID"], ["বোর্ড রোল", "Board Roll"],
  ["ক্লাস রোল", "Class Roll"], ["শাখা", "Branch"], ["শ্রেণি", "Class"], ["ট্রেড", "Trade"], ["মেধাতালিকায় অবস্থান", "Merit position"],
  ["ফেল বিষয় সংখ্যা", "Number of failed subjects"], ["অনুপস্থিত বিষয় সংখ্যা", "Number of absent subjects"],
  ["মেধাতালিকায় যে তথ্য দেখাবেন", "Information to show in the merit list"], ["মেধাক্রম", "Merit Rank"],
  ["শিক্ষার্থীর নাম", "Student Name"], ["প্রাপ্ত নম্বর", "Marks Obtained"], ["শতকরা", "Percentage"],
  ["এই শিক্ষার্থীর প্রতিটি বিষয়ের তাত্ত্বিক ও ব্যবহারিক নম্বর পূর্ণমানের মধ্যে দিন।", "Enter this student's theory and practical marks within the full marks for each subject."],
  ["নম্বরের খসড়া সেভ হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not save the marks draft. Check Firestore access rules."],
  ["+ বিষয় যোগ", "+ Add Subject"], ["ওয়েবসাইটে ফলাফল প্রকাশ করুন", "Publish results on the website"],
  ["ফলাফল সংরক্ষণ", "Save Results"], ["সংরক্ষিত ফলাফল", "Saved Results"], ["পরীক্ষা", "Exam"], ["মোট নম্বর", "Total Marks"],
  ["শ্রেণির সকল একক ফলাফল PDF", "PDF of All Individual Results in Class"],
  ["যে বিষয়ের নম্বর দেবেন", "Subject to enter marks for"], ["অনুপস্থিতি", "Absent"], ["সব বিষয়ে অনুপস্থিত", "Absent in all subjects"], ["হ্যাঁ", "Yes"],
  ["PDF তৈরির আগে শ্রেণি, পরীক্ষা ও শিক্ষাবর্ষ নির্বাচন করুন।", "Select class, exam, and academic year before creating the PDF."],
  ["নির্বাচিত শ্রেণি, পরীক্ষা ও শিক্ষাবর্ষের কোনো সংরক্ষিত ফলাফল পাওয়া যায়নি।", "No saved results were found for the selected class, exam, and academic year."],
  ["PDF তৈরির প্রিন্ট উইন্ডো খুলতে ব্রাউজারের পপ-আপ অনুমতি দিন।", "Allow pop-ups in your browser to open the PDF print window."],
  ["PDF প্রিন্টে প্রস্তুত। গন্তব্য থেকে “Save as PDF” নির্বাচন করুন।", "PDF is ready to print. Select “Save as PDF” as the destination."],
  ["প্রকাশিত", "Published"], ["গোপন", "Hidden"], ["এডিট", "Edit"], ["মুছুন", "Delete"], ["সরান", "Remove"],
  ["পূর্ণমান", "Full Marks"], ["প্রাপ্ত নম্বর", "Marks Obtained"],
  ["বিষয়ের নাম", "Subject Name"], ["বিষয় কোড", "Subject Code"],
  ["বাংলা 1", "Bangla 1"], ["ইংরেজি 1", "English 1"], ["গণিত 1", "Mathematics 1"], ["বাওবি 1", "Bangladesh and World Identity 1"], ["পদার্থ 1", "Physics 1"], ["রসায়ন", "Chemistry"],
  ["ইসলাম শিক্ষা 1", "Islamic Studies 1"], ["হিন্দু ধর্ম শিক্ষা 1", "Hindu Religious Studies 1"], ["খ্রিস্ট ধর্ম শিক্ষা 1", "Christian Religious Studies 1"], ["কৃষিশিক্ষা 1", "Agriculture 1"],
  ["এগ্রো বেসড ফুড 1", "Agro-Based Food 1"], ["এপারেল 1", "Apparel 1"], ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস 1", "Apparel Manufacturing Basics 1"], ["জেনারেল মেকানিক্স 1", "General Mechanics 1"], ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস 1", "IT Support and IoT Basics 1"], ["জেনারেল ইলেকট্রনিক্স 1", "General Electronics 1"],
  ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস 2", "IT Support and IoT Basics 2"], ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস ২", "IT Support and IoT Basics 2"], ["জেনারেল ইলেকট্রনিক্স 2", "General Electronics 2"], ["ইঞ্জিনিয়ারিং ড্রইং", "Engineering Drawing"], ["কম্পিউটার অ্যাপ্লিকেশন 1", "Computer Application 1"],
  ["বাংলা 2", "Bangla 2"], ["ইংরেজি 2", "English 2"], ["গণিত 2", "Mathematics 2"], ["বাওবি 2", "Bangladesh and World Identity 2"], ["পদার্থ 2", "Physics 2"], ["রসায়ন 2", "Chemistry 2"],
  ["ইসলাম শিক্ষা 2", "Islamic Studies 2"], ["হিন্দু ধর্ম শিক্ষা 2", "Hindu Religious Studies 2"], ["খ্রিস্ট ধর্ম শিক্ষা 2", "Christian Religious Studies 2"], ["কৃষিশিক্ষা 2", "Agriculture 2"],
  ["এগ্রো বেসড ফুড 3", "Agro-Based Food 3"], ["এপারেল 3", "Apparel 3"], ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস 2", "Apparel Manufacturing Basics 2"], ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস 3", "Apparel Manufacturing Basics 3"], ["জেনারেল মেকানিক্স 3", "General Mechanics 3"], ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস 3", "IT Support and IoT Basics 3"], ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস ৩", "IT Support and IoT Basics 3"], ["জেনারেল ইলেকট্রনিক্স 3", "General Electronics 3"],
  ["এগ্রো বেসড ফুড 4", "Agro-Based Food 4"], ["এপারেল 4", "Apparel 4"], ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস 4", "Apparel Manufacturing Basics 4"], ["জেনারেল মেকানিক্স 4", "General Mechanics 4"], ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস 4", "IT Support and IoT Basics 4"], ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস ৪", "IT Support and IoT Basics 4"], ["জেনারেল ইলেকট্রনিক্স 4", "General Electronics 4"],
  ["আত্মকর্মসংস্থান ও ব্যবসায় উদ্যোগ", "Self-Employment and Business Initiative"], ["কম্পিউটার অ্যাপ্লিকেশন 2", "Computer Application 2"],
  ["তথ্য লোড হচ্ছে...", "Loading data..."], ["শিক্ষার্থীর তথ্য লোড হচ্ছে...", "Loading student records..."],
  ["এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি।", "No students have been registered yet."], ["এখনো কোনো জমার তথ্য নেই।", "No payments have been recorded yet."], ["০ জন নির্বাচিত", "0 selected"],
  ["এখনো কোনো ফলাফল সংরক্ষণ করা হয়নি।", "No results have been saved yet."], ["এখনো কোনো নোটিশ নেই।", "There are no notices yet."],
  ["শিরোনাম নেই", "Untitled"], ["অবস্থা: প্রকাশিত", "Status: Published"], ["অবস্থা: অপ্রকাশিত", "Status: Unpublished"],
  ["PDF খুলুন", "Open PDF"], ["অপ্রকাশিত করুন", "Unpublish"], ["প্রকাশ করুন", "Publish"],
  ["প্রোফাইল সংরক্ষণ হচ্ছে...", "Saving profile..."], ["প্রোফাইল হালনাগাদ হয়েছে।", "Profile updated."],
  ["প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।", "Could not save the profile. Please try again."],
  ["ছবির লিংক https:// দিয়ে শুরু হতে হবে।", "The photo URL must start with https://."],
  ["ছবির লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে।", "The photo URL must start with https://."],
  ["নাম লিখুন।", "Enter a name."], ["← ড্যাশবোর্ডে ফিরুন", "← Back to Dashboard"],
  ["লগআউট করা যায়নি। আবার চেষ্টা করুন।", "Could not log out. Please try again."],
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
    const resultGrid = core.match(/^(.+) জন শিক্ষার্থীর জন্য নম্বরের ছক তৈরি হয়েছে।$/);
    if (resultGrid) translated = `Mark sheet prepared for ${resultGrid[1]} students.`;
    const savedDraft = core.match(/^(.+) — নম্বরের খসড়া সেভ হয়েছে। পরে একই পরীক্ষা তৈরি করলে নম্বর ফিরে আসবে।$/);
    if (!translated && savedDraft) translated = `${savedDraft[1]} — Marks draft saved. Reopen the same class, exam, and year to restore the marks.`;
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
    const resultGrid = core.match(/^Mark sheet prepared for (.+) students\.$/);
    if (resultGrid) translated = `${resultGrid[1]} জন শিক্ষার্থীর জন্য নম্বরের ছক তৈরি হয়েছে।`;
    const savedDraft = core.match(/^(.+) — Marks draft saved\. Reopen the same class, exam, and year to restore the marks\.$/);
    if (savedDraft) translated = `${savedDraft[1]} — নম্বরের খসড়া সেভ হয়েছে। পরে একই পরীক্ষা তৈরি করলে নম্বর ফিরে আসবে।`;
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



