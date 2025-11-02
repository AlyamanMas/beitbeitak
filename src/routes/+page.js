import { supabase } from '$lib/supabaseClient.js';

// Prerender the page shell
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export const load = async () => {
	// Get the towns enum values for the filter
	// TODO: move this somewhere else. Why did you even put it here, claude ;-;
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

	// Fetch all house listings with their images
	const listingsPromise = supabase
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

	return {
		listings: listingsPromise,
		towns
	};
};
