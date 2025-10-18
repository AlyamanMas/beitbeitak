import { supabase } from '$lib/supabaseClient.js';

/**
 * @typedef {Object} HouseListing
 * @property {number} id
 * @property {string} created_at
 * @property {string} town
 * @property {number} rent_per_month
 * @property {string} author
 * @property {number} size_m2
 * @property {number} num_bedrooms
 * @property {number} num_bathrooms
 * @property {string} address
 * @property {string|null} source_url
 * @property {string|null} phone_number
 * @property {boolean} whatsapp_comm
 * @property {boolean} rent_in_usd
 * @property {Array<{pic_name: string}>} listing_to_pic
 */

/** @type {import('./$types').PageLoad} */
export async function load() {
	// Fetch all house listings with their images
	const { data: listings, error } = await supabase
		.from('house_listings')
		.select(
			`
      *,
      listing_to_pic (
        pic_name
      )
    `
		)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching listings:', error);
		return {
			listings: []
		};
	}

	// Get the towns enum values for the filter
	const towns = [
		'Al-Hamidiyah',
		'Bab al-Dreib',
		'Bab Tadmur',
		'Bab Hud',
		'Al-Qarabis',
		'Al-Qusour',
		'Al-Waer',
		'Al-Ghouta',
		'Inshaat',
		'Al-Adawiyah'
	];

	return {
		listings: listings || [],
		towns
	};
}
