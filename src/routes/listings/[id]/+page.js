import { supabase } from '$lib/supabaseClient.js';
import { error } from '@sveltejs/kit';

// Disable prerendering for dynamic route
export const prerender = false;

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	const { data: listing, error: fetchError } = await supabase
		.from('house_listings')
		.select(
			`
      *,
      listing_to_pic (
        pic_name
      ),
      users (
        first_name,
        last_name
      )
    `
		)
		.eq('id', params.id)
		.single();

	if (fetchError || !listing) {
		error(404, 'لم يتم العثور على العقار');
	}

	return {
		listing
	};
}
