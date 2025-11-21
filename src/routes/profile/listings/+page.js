import { supabase } from '$lib/supabaseClient.js';

// Disable prerendering for authenticated route
export const prerender = false;

/** @type {import('./$types').PageLoad} */
export async function load({ url }) {
	// Get current user
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			listings: []
		};
	}

	// Get filter parameters
	let minPrice = url.searchParams.get('minPrice');
	let maxPrice = url.searchParams.get('maxPrice');
	let towns = url.searchParams.getAll('town');
	let numBedrooms = url.searchParams.get('numBedrooms');
	let numBathrooms = url.searchParams.get('numBathrooms');

	// Fetch user's listings with filters
	let listingsQuery = supabase
		.from('house_listings')
		.select(
			`
			*,
			listing_to_pic (pic_name)
		`
		)
		.eq('author', user.id)
		.order('created_at', { ascending: false });

	// Apply filters
	if (numBedrooms !== null) {
		listingsQuery = listingsQuery.eq('num_bedrooms', parseInt(numBedrooms));
	}
	if (numBathrooms !== null) {
		listingsQuery = listingsQuery.eq('num_bathrooms', parseInt(numBathrooms));
	}
	if (towns !== null && towns.length > 0) {
		listingsQuery = listingsQuery.in('town', towns);
	}
	if (minPrice !== null) {
		listingsQuery = listingsQuery.gte('rent_per_month', parseInt(minPrice));
	}
	if (maxPrice !== null) {
		listingsQuery = listingsQuery.lte('rent_per_month', parseInt(maxPrice));
	}

	const { data: listings, error } = await listingsQuery;

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
