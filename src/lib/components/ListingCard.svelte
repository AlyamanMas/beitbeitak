<script>
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic } from '$lib/towns.js';
	import { Home, Bed, Bath, Maximize } from 'lucide-svelte';

	const { /** @type {HouseListing} */ listing } = $props();

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
		const formatted = price.toLocaleString('ar-SY');
		return isUsd ? `$${formatted}` : `${formatted} ل.س`;
	}
</script>

<a
	href={resolve(`/listings/${listing.id}`)}
	class="card bg-base-100 shadow-md transition-shadow hover:shadow-lg"
>
	<div class="card-body p-4">
		<!-- Images Grid -->
		{#if listing.listing_to_pic && listing.listing_to_pic.length > 0}
			<div class="mb-3">
				{#if listing.listing_to_pic.length === 1}
					<!-- Single Image -->
					<div class="h-48 w-full overflow-hidden rounded-lg">
						<img
							src={getImageUrl(listing.listing_to_pic[0].pic_name)}
							alt="صورة العقار"
							class="h-full w-full object-cover"
						/>
					</div>
				{:else if listing.listing_to_pic.length === 2}
					<!-- Two Images -->
					<div class="grid h-48 grid-cols-2 gap-2">
						{#each listing.listing_to_pic.slice(0, 2) as pic (pic)}
							<div class="overflow-hidden rounded-lg">
								<img
									src={getImageUrl(pic.pic_name)}
									alt="صورة العقار"
									class="h-full w-full object-cover"
								/>
							</div>
						{/each}
					</div>
				{:else}
					<!-- Three or More Images -->
					<div class="grid h-48 grid-cols-2 gap-2">
						<!-- First image takes full height on the right -->
						<div class="row-span-2 overflow-hidden rounded-lg">
							<img
								src={getImageUrl(listing.listing_to_pic[0].pic_name)}
								alt="صورة العقار"
								class="h-full w-full object-cover"
							/>
						</div>
						<!-- Second image on top left -->
						<div class="overflow-hidden rounded-lg">
							<img
								src={getImageUrl(listing.listing_to_pic[1].pic_name)}
								alt="صورة العقار"
								class="h-full w-full object-cover"
							/>
						</div>
						<!-- Third image or overlay on bottom left -->
						<div class="relative overflow-hidden rounded-lg">
							<img
								src={getImageUrl(listing.listing_to_pic[2].pic_name)}
								alt="صورة العقار"
								class="h-full w-full object-cover"
							/>
							{#if listing.listing_to_pic.length > 3}
								<div class="absolute inset-0 flex items-center justify-center bg-black/60">
									<span class="text-2xl font-bold text-white">
										+{listing.listing_to_pic.length - 3}
									</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Listing Info -->
		<div class="space-y-2">
			<!-- Price -->
			<div class="flex items-center justify-between">
				<h3 class="text-xl font-bold text-primary">
					{formatPrice(listing.rent_per_month, listing.rent_in_usd)}
					<span class="text-sm font-normal text-base-content/70">/شهرياً</span>
				</h3>
			</div>

			<!-- Town -->
			<p class="flex items-center gap-1 text-sm text-base-content/80">
				<Home size={16} />
				{getTownNameArabic(listing.town)}
			</p>

			<!-- Property Details -->
			<div class="flex gap-4 text-sm text-base-content/80">
				<div class="flex items-center gap-1">
					<Maximize size={16} />
					{listing.size_m2} م²
				</div>
				<div class="flex items-center gap-1">
					<Bed size={16} />
					{listing.num_bedrooms} غرفة
				</div>
				<div class="flex items-center gap-1">
					<Bath size={16} />
					{listing.num_bathrooms} حمام
				</div>
			</div>

			<!-- Address -->
			<p class="truncate text-sm text-base-content/60">
				{listing.address}
			</p>
		</div>
	</div>
</a>
