import { supabase } from '$lib/supabaseClient.js';

/** @type {import('./$types').PageLoad} */
export async function load() {
	// Get current user
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			listings: []
		};
	}

	// Fetch user's listings
	const { data: listings, error } = await supabase
		.from('house_listings')
		.select(
			`
			*,
			listing_to_pic (pic_name)
		`
		)
		.eq('author', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching user listings:', error);
		return {
			listings: []
		};
	}

	return {
		listings: listings || []
	};
}
