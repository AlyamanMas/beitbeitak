import { supabase } from '$lib/supabaseClient.js';
import { browser } from '$app/environment';

// Prerender the page shell
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load() {
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

	// Only fetch data on the client side
	if (!browser) {
		return {
			listings: [],
			towns
		};
	}

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
			listings: [],
			towns
		};
	}

	return {
		listings: listings || [],
		towns
	};
}
