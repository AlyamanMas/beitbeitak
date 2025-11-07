/**
 * @typedef {"Al-Hamidiyah" | "Bab al-Dreib" | "Bab Tadmur" | "Bab Hud" | "Al-Qarabis" | "Al-Qusour" | "Al-Waer" | "Al-Ghouta" | "Inshaat" | "Al-Adawiyah"} Town
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
	'Al-Adawiyah': 'العدوية'
};

export const towns = Object.keys(townNamesArabic);

/**
 * Get Arabic town name from English name
 * @param {Town} townEnglish
 * @returns {string}
 */
export function getTownNameArabic(townEnglish) {
	return townNamesArabic[townEnglish] || townEnglish;
}
