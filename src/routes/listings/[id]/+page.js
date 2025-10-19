import { supabase } from '$lib/supabaseClient.js';
import { error } from '@sveltejs/kit';

// Disable prerendering for dynamic route
export const prerender = false;

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
 * @property {Object} users
 * @property {string} users.first_name
 * @property {string} users.last_name
 */

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
