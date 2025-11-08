<script>
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic } from '$lib/towns.js';
	import 'beercss/custom-element';

	/**
	 * @type {{ listing: HouseListing }}
	 */
	const { listing } = $props();

	/**
	 * Get public URL for an image from Supabase storage
	 * @param {string} picName
	 * @returns {string}
	 */
	function getImageUrl(picName) {
		const { data } = supabase.storage.from('house_pics').getPublicUrl(picName);
		return data.publicUrl;
	}

	/**
	 * Format price with currency
	 * @param {number} price
	 * @param {boolean} isUsd
	 * @returns {string}
	 */
	function formatPrice(price, isUsd) {
		const formatted = price.toLocaleString('en-SY');
		return isUsd ? `$${formatted}` : `${formatted} ل.س`;
	}

	let properties = [
		['home', getTownNameArabic(listing.town)],
		['activity_zone', `${listing.size_m2} م²`],
		['bedroom_parent', `${listing.num_bedrooms} غرفة`],
		['bathroom', `${listing.num_bathrooms} حمام`],
		['location_on', listing.address]
	];
</script>

<beer-css>
	<a href={resolve(`/listings/${listing.id}`)}>
		<article class="no-padding no-elevate max-w-sm">
			{#if listing.listing_to_pic && listing.listing_to_pic.length > 0}
				<img
					src={getImageUrl(listing.listing_to_pic[0].pic_name)}
					alt="صورة العقار"
					class="h-60 w-full object-cover"
				/>
			{/if}
			<div class="padding">
				<div aria-label="price">
					<!-- prettier-ignore -->
					<p class="text-2xl">
						{formatPrice(listing.rent_per_month, listing.rent_in_usd)}<span class="text-xl">/شهرياً</span>
					</p>
				</div>
				<div aria-label="property details" class="flex flex-wrap gap-2">
					{#each properties as property (property[0])}
						<span class="chip no-wave" style="margin-inline: 0px;">
							<i>{property[0]}</i>{property[1]}
						</span>
					{/each}
				</div>
			</div>
		</article>
	</a>
</beer-css>
