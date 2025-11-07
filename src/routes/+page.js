import { supabase } from '$lib/supabaseClient.js';

// Prerender the page shell
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export const load = async () => {
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
		listings: listingsPromise
	};
};
