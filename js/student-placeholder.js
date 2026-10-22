const femaleNameTokens = new Set([
  "ADURI", "AFRIN", "AFSANA", "AISHA", "AKHILA", "AKHI", "AKLIMA", "AMENA",
  "AMINA", "ANIKA", "ANJUM", "ARIFA", "ASMA", "AYESHA", "BANDANA", "BEAUTY",
  "BEGUM", "BILKIS", "BONNA", "CHAMPA", "DIPTI", "FARIA", "FARJANA", "FATEMA",
  "FATIMA", "FERDOUSI", "HABIBA", "HASINA", "JANNAT", "JANNATUL", "JARIN",
  "JASMIN", "JESMIN", "JUI", "KHADIJA", "KHATUN", "KULSUM", "LABONI", "LIZA",
  "MARIAM", "MARIA", "MIM", "MITHILA", "MITU", "MOUSUMI", "MST", "MUNNI",
  "NADIA", "NADIRA", "NARGIS", "NASIMA", "NILA", "NIPA", "NUSRAT", "POPI",
  "POPY", "RAHIMA", "RANI", "REHANA", "RINA", "ROKEYA", "RUMA", "RUMANA",
  "SABINA", "SADIA", "SAFA", "SAJEDA", "SALMA", "SAMIA", "SAMIYA", "SANGITA",
  "SATHI", "SHAMIMA", "SHARMIN", "SHILA", "SHIRIN", "SHUMA", "SHUMI", "SULTANA",
  "SUMA", "SUMAIYA", "TANIA", "TANJILA", "TANJINA", "TASLIMA", "TASNUVA", "URMI",
  "ZAHANARA", "ZAKIA", "আফরিন", "আয়েশা", "জান্নাত", "জেসমিন", "জুঁই", "তানিয়া",
  "দীপ্তি", "নাদিয়া", "নাজমা", "নিপা", "নুসরাত", "পপি", "ফারজানা", "ফাতেমা",
  "বৃষ্টি", "মিম", "মৌসুমী", "রিনা", "রিমা", "রোকসানা", "শারমিন", "শিলা", "সাদিয়া",
  "সাফা", "সুমা", "সুমাইয়া", "সুমি", "সুলতানা", "খাতুন", "বেগম", "মোছাঃ", "মোসাঃ"
]);

function normalizedTokens(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleUpperCase("en-US")
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function studentPlaceholderForName(name, gender = "") {
  const explicit = String(gender || "").trim().toLocaleLowerCase();
  if (["female", "girl", "ছাত্রী", "মেয়ে", "নারী"].includes(explicit)) {
    return "images/student-placeholder-female.svg?v=20261022-silhouette2";
  }
  if (["male", "boy", "ছাত্র", "পুরুষ"].includes(explicit)) {
    return "images/student-placeholder.svg?v=20261022-silhouette2";
  }

  const tokens = normalizedTokens(name);
  const femaleByName = tokens.some((token) => femaleNameTokens.has(token))
    || tokens[0] === "AKTER";
  return femaleByName
    ? "images/student-placeholder-female.svg?v=20261022-silhouette2"
    : "images/student-placeholder.svg?v=20261022-silhouette2";
}
