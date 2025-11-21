/**
 * @typedef {"Al-Hamidiyah" | "Bab al-Dreib" | "Bab Tadmur" | "Bab Hud" | "Al-Qarabis" | "Al-Qusour" | "Al-Waer" | "Al-Ghouta" | "Inshaat" | "Al-Adawiyah" | "Bab al-Sbaa" | "Baba Amro" | "Jurat al-Shayyah" | "Al-Bayadah" | "Al-Khalidiyyah" | "Al-Zahraa" | "Ekrama" | "Masaken Al-Taminat" | "Wadi Al-Dhahab" | "Der B3ilba"} Town
 */

/**
 * Town name translations from English to Arabic
 * @type {Record<Town, string>}
 */
export const townNamesArabic = {
	'Al-Hamidiyah': 'الحميدية',
	'Bab al-Dreib': 'باب الدريب',
	'Bab Tadmur': 'باب تدمر',
	'Bab Hud': 'باب هود',
	'Al-Qarabis': 'القرابيص',
	'Al-Qusour': 'القصور',
	'Al-Waer': 'الوعر',
	'Al-Ghouta': 'الغوطة',
	Inshaat: 'إنشاءات',
	'Al-Adawiyah': 'العدوية',
	'Bab al-Sbaa': 'باب السباع',
	'Baba Amro': 'بابا عمرو',
	'Jurat al-Shayyah': 'جورة الشياح',
	'Al-Bayadah': 'البياضة',
	'Al-Khalidiyyah': 'الخالدية',
	'Al-Zahraa': 'الزهراء',
	Ekrama: 'عكرمة',
	'Masaken Al-Taminat': 'مساكن الأمانات',
	'Wadi Al-Dhahab': 'وادي الذهب',
	'Der B3ilba': 'دير بعلبة'
};

export const towns = /** @type(Town[]) */ (Object.keys(townNamesArabic));

/**
 * Get Arabic town name from English name
 * @param {Town} townEnglish
 * @returns {string}
 */
export function getTownNameArabic(townEnglish) {
	return townNamesArabic[townEnglish] || townEnglish;
}
