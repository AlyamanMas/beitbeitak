import { supabase } from '$lib/supabaseClient.js';
import { error, redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	const { id } = params;

	// Get current user
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/auth/login');
	}

	// Fetch the listing with images
	const { data: listing, error: listingError } = await supabase
		.from('house_listings')
		.select(
			`
			*,
			listing_to_pic (pic_name)
		`
		)
		.eq('id', id)
		.single();

	if (listingError) {
		console.error('Error fetching listing:', listingError);
		throw error(404, 'الإعلان غير موجود');
	}

	// Check if user is the author
	if (listing.author !== user.id) {
		throw error(403, 'ليس لديك صلاحية لتعديل هذا الإعلان');
	}

	return {
		listing
	};
}
