/*! 🌼 daisyUI 5.3.7 */
<script>
	import { supabase } from '$lib/supabaseClient.js'
	import { getTownNameArabic } from '$lib/towns.js'
	import { isAuthenticated } from '$lib/stores/authStore.svelte.js'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { Home, Bed, Bath, Maximize, SlidersHorizontal, X, Plus } from 'lucide-svelte'

	/** @type {import('./$types').PageProps} */
	let { data } = $props()

	/**
	 * Handle add listing button click
	 */
	function handleAddListing() {
		if (!isAuthenticated()) {
			goto(resolve('/auth/login'))
		} else {
			goto(resolve('/listings/new'))
		}
	}

	// Filter states
	let showFilters = $state(false)
	let showTownFilter = $state(false)
	let selectedTown = $state('')
	let minPrice = $state(0)
	let maxPrice = $state(10000000)
	let minBedrooms = $state(0)
	let minBathrooms = $state(0)

	/**
	 * Get public URL for an image from Supabase storage
	 * @param {string} picName
	 * @returns {string}
	 */
	function getImageUrl(picName) {
		const { data } = supabase.storage.from('house_pics').getPublicUrl(picName)
		return data.publicUrl
	}

	/**
	 * Filter listings based on selected criteria
	 * @type {import('./$types').PageProps['data']['listings']}
	 */
	let filteredListings = $derived(
		data.listings.filter((listing) => {
			if (selectedTown && listing.town !== selectedTown) return false
			if (listing.rent_per_month < minPrice || listing.rent_per_month > maxPrice) return false
			if (listing.num_bedrooms < minBedrooms) return false
			if (listing.num_bathrooms < minBathrooms) return false
			return true
		})
	)

	/**
	 * Format price with currency
	 * @param {number} price
	 * @param {boolean} isUsd
	 * @returns {string}
	 */
	function formatPrice(price, isUsd) {
		const formatted = price.toLocaleString('ar-SY')
		return isUsd ? `$${formatted}` : `${formatted} ل.س`
	}

	/**
	 * Count active filters (excluding town since it has its own button)
	 * @returns {number}
	 */
	let activeFiltersCount = $derived(() => {
		let count = 0
		if (minPrice > 0) count++
		if (maxPrice < 10000000) count++
		if (minBedrooms > 0) count++
		if (minBathrooms > 0) count++
		return count
	})

	/**
	 * Reset all filters
	 */
	function resetFilters() {
		selectedTown = ''
		minPrice = 0
		maxPrice = 10000000
		minBedrooms = 0
		minBathrooms = 0
	}
</script>

<div class="min-h-screen bg-base-200 p-4 pb-24" dir="rtl">
	<!-- Header -->
	<div class="mb-4">
		<h1 class="mb-2 text-center text-3xl font-bold">البيت بيتك</h1>
		<p class="text-center text-base-content/70">ابحث عن بيت أحلامك في حمص</p>
	</div>

	<!-- Filter Buttons -->
	<div class="mb-4 flex items-center justify-between gap-2">
		<div class="flex flex-1 gap-2">
			<!-- Town Filter Button -->
			<div class="relative">
				<button
					onclick={() => (showTownFilter = !showTownFilter)}
					class="btn gap-2 btn-outline btn-sm"
				>
					<Home size={16} />
					{selectedTown ? getTownNameArabic(selectedTown) : 'المنطقة'}
				</button>
				{#if showTownFilter}
					<!-- Dropdown overlay to close on outside click -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="fixed inset-0 z-10"
						onclick={() => (showTownFilter = false)}
						role="button"
						tabindex="-1"
					></div>
					<div
						class="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-base-300 bg-base-100 p-2 shadow-lg"
					>
						<ul class="menu overflow-y-auto p-0">
							<li>
								<button
									onclick={() => {
										selectedTown = ''
										showTownFilter = false
									}}
									class="text-right {selectedTown === '' ? 'active' : ''}"
								>
									جميع المناطق
								</button>
							</li>
							{#each data.towns as town (town)}
								<li>
									<button
										onclick={() => {
											selectedTown = town
											showTownFilter = false
										}}
										class="text-right {selectedTown === town ? 'active' : ''}"
									>
										{getTownNameArabic(town)}
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<!-- All Filters Button -->
			<button onclick={() => (showFilters = true)} class="btn gap-2 btn-outline btn-sm">
				<SlidersHorizontal size={16} />
				المزيد
				{#if activeFiltersCount() > 0}
					<span class="badge badge-sm badge-primary">{activeFiltersCount()}</span>
				{/if}
			</button>
		</div>

		<div class="text-sm text-base-content/70">
			{filteredListings.length} عقار
		</div>
	</div>

	<!-- Filters Drawer -->
	{#if showFilters}
		<!-- Overlay -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-[60] bg-black/50"
			onclick={() => (showFilters = false)}
			role="button"
			tabindex="-1"
		></div>
		<!-- Drawer Panel -->
		<div class="fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-base-100 shadow-xl">
			<div class="flex h-full flex-col">
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-base-300 p-4">
					<h2 class="text-xl font-bold">تصفية النتائج</h2>
					<button
						onclick={() => (showFilters = false)}
						class="btn btn-circle btn-ghost btn-sm"
						aria-label="إغلاق"
					>
						<X size={20} />
					</button>
				</div>

				<!-- Filters Content -->
				<div class="flex-1 space-y-4 overflow-y-auto p-4">
					<!-- Town Filter -->
					<div class="form-control w-full">
						<label class="label" for="town-select">
							<span class="label-text font-semibold">المنطقة</span>
						</label>
						<select
							id="town-select"
							class="select-bordered select w-full"
							bind:value={selectedTown}
						>
							<option value="">جميع المناطق</option>
							{#each data.towns as town (town)}
								<option value={town}>{getTownNameArabic(town)}</option>
							{/each}
						</select>
					</div>

					<!-- Price Range -->
					<div class="form-control w-full">
						<label class="label" for="min-price">
							<span class="label-text font-semibold">الحد الأدنى للسعر</span>
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
							<span class="label-text font-semibold">الحد الأقصى للسعر</span>
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
							<span class="label-text font-semibold">الحد الأدنى لعدد غرف النوم: {minBedrooms}</span
							>
						</label>
						<input
							id="bedrooms"
							type="range"
							min="0"
							max="10"
							class="range range-primary"
							bind:value={minBedrooms}
						/>
						<div class="flex w-full justify-between px-2 text-xs">
							<span>0</span>
							<span>5</span>
							<span>10</span>
						</div>
					</div>

					<!-- Bathrooms Filter -->
					<div class="form-control w-full">
						<label class="label" for="bathrooms">
							<span class="label-text font-semibold">الحد الأدنى لعدد الحمامات: {minBathrooms}</span
							>
						</label>
						<input
							id="bathrooms"
							type="range"
							min="0"
							max="5"
							class="range range-primary"
							bind:value={minBathrooms}
						/>
						<div class="flex w-full justify-between px-2 text-xs">
							<span>0</span>
							<span>2</span>
							<span>5</span>
						</div>
					</div>
				</div>

				<!-- Footer Actions -->
				<div class="border-t border-base-300 p-4">
					<div class="flex gap-2">
						<button onclick={resetFilters} class="btn flex-1 btn-ghost"> إعادة تعيين </button>
						<button onclick={() => (showFilters = false)} class="btn flex-1 btn-primary">
							تطبيق
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Listings Grid -->
	<div class="grid grid-cols-1 gap-4">
		{#each filteredListings as listing (listing.id)}
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
		{:else}
			<div class="text-center py-12">
				<p class="text-lg text-base-content/60">لا توجد نتائج تطابق معايير البحث</p>
			</div>
		{/each}
	</div>

	<!-- FAB Button for Adding Listings -->
	{#if !showFilters}
		<div class="fab" style="bottom: 5rem;">
			<button
				onclick={handleAddListing}
				class="btn btn-circle btn-lg btn-primary"
				aria-label="إضافة إعلان"
			>
				<Plus size={28} />
			</button>
		</div>
	{/if}
</div>
