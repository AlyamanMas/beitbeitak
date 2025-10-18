/**
 * Town name translations from English to Arabic
 * @type {Object.<string, string>}
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

/**
 * Get Arabic town name from English name
 * @param {string} townEnglish
 * @returns {string}
 */
export function getTownNameArabic(townEnglish) {
	return townNamesArabic[townEnglish] || townEnglish;
}
