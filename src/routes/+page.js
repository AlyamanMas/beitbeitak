import { supabase } from '$lib/supabaseClient.js';

// Prerender the page shell
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export const load = async ({ url }) => {
	let minPrice = url.searchParams.get('minPrice');
	let maxPrice = url.searchParams.get('maxPrice');
	let town = url.searchParams.get('town');
	let numBedrooms = url.searchParams.get('numBedrooms');
	let numBathrooms = url.searchParams.get('numBathrooms');

	let townVal = url.searchParams.get('town');
	townVal ? (town = townVal) : null;
	// Fetch all house listings with their images
	let listingsPromise = supabase
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

	// Filter the query by number of bedrooms and bathrooms if parameters are provided
	if (numBedrooms !== null) {
		listingsPromise = listingsPromise.eq('num_bedrooms', parseInt(numBedrooms));
	}
	if (numBathrooms !== null) {
		listingsPromise = listingsPromise.eq('num_bathrooms', parseInt(numBathrooms));
	}
	if (town !== null) {
		listingsPromise = listingsPromise.eq('town', town);
	}
	if (minPrice !== null) {
		listingsPromise = listingsPromise.gte('rent_per_month', parseInt(minPrice));
	}
	if (maxPrice !== null) {
		listingsPromise = listingsPromise.lte('rent_per_month', parseInt(maxPrice));
	}

	return {
		listings: listingsPromise
	};
};
