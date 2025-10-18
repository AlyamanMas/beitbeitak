<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { Home, Bed, Bath, Maximize } from 'lucide-svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// Filter states
	let selectedTown = $state('');
	let minPrice = $state(0);
	let maxPrice = $state(10000000);
	let minBedrooms = $state(0);
	let minBathrooms = $state(0);

	/**
	 * Get public URL for an image from Supabase storage
	 * @param {string} picId
	 * @returns {string}
	 */
	function getImageUrl(picId) {
		const { data } = supabase.storage.from('house_pics').getPublicUrl(picId);
		return data.publicUrl;
	}

	/**
	 * Filter listings based on selected criteria
	 * @type {import('./$types').PageProps['data']['listings']}
	 */
	let filteredListings = $derived(
		data.listings.filter((listing) => {
			if (selectedTown && listing.town !== selectedTown) return false;
			if (listing.rent_per_month < minPrice || listing.rent_per_month > maxPrice) return false;
			if (listing.num_bedrooms < minBedrooms) return false;
			if (listing.num_bathrooms < minBathrooms) return false;
			return true;
		})
	);

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

<div class="min-h-screen bg-base-200 p-4" dir="rtl">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="mb-2 text-center text-3xl font-bold">بيت بيتك</h1>
		<p class="text-center text-base-content/70">ابحث عن بيت أحلامك في حمص</p>
	</div>

	<!-- Filters -->
	<div class="mb-6 rounded-lg bg-base-100 p-4 shadow-md">
		<h2 class="mb-4 text-lg font-semibold">تصفية النتائج</h2>

		<div class="grid grid-cols-1 gap-4">
			<!-- Town Filter -->
			<div class="form-control w-full">
				<label class="label" for="town-select">
					<span class="label-text">المنطقة</span>
				</label>
				<select id="town-select" class="select-bordered select w-full" bind:value={selectedTown}>
					<option value="">جميع المناطق</option>
					{#each data.towns as town (town)}
						<option value={town}>{town}</option>
					{/each}
				</select>
			</div>

			<!-- Price Range -->
			<div class="form-control w-full">
				<label class="label" for="min-price">
					<span class="label-text">الحد الأدنى للسعر</span>
				</label>
				<input
					id="min-price"
					type="number"
					placeholder="0"
					class="input-bordered input w-full"
					bind:value={minPrice}
				/>
			</div>

			<div class="form-control w-full">
				<label class="label" for="max-price">
					<span class="label-text">الحد الأقصى للسعر</span>
				</label>
				<input
					id="max-price"
					type="number"
					placeholder="10000000"
					class="input-bordered input w-full"
					bind:value={maxPrice}
				/>
			</div>

			<!-- Bedrooms Filter -->
			<div class="form-control w-full">
				<label class="label" for="bedrooms">
					<span class="label-text">الحد الأدنى لعدد غرف النوم: {minBedrooms}</span>
				</label>
				<input
					id="bedrooms"
					type="range"
					min="0"
					max="10"
					class="range range-primary"
					bind:value={minBedrooms}
				/>
			</div>

			<!-- Bathrooms Filter -->
			<div class="form-control w-full">
				<label class="label" for="bathrooms">
					<span class="label-text">الحد الأدنى لعدد الحمامات: {minBathrooms}</span>
				</label>
				<input
					id="bathrooms"
					type="range"
					min="0"
					max="5"
					class="range range-primary"
					bind:value={minBathrooms}
				/>
			</div>
		</div>
	</div>

	<!-- Listings Count -->
	<div class="mb-4">
		<p class="text-sm text-base-content/70">
			عدد النتائج: {filteredListings.length}
		</p>
	</div>

	<!-- Listings Grid -->
	<div class="grid grid-cols-1 gap-4">
		{#each filteredListings as listing (listing.id)}
			<a
				href="/listings/{listing.id}"
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
							{listing.town}
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
		{:else}
			<div class="text-center py-12">
				<p class="text-lg text-base-content/60">لا توجد نتائج تطابق معايير البحث</p>
			</div>
		{/each}
	</div>
</div>
