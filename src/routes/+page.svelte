<script>
	import { getTownNameArabic } from '$lib/towns.js';
	import { isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ListingCard from '$lib/components/ListingCard.svelte';
	import { SlidersHorizontal, House, X } from 'lucide-svelte';
	import 'beercss/custom-element';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	/**
	 * Handle add listing button click
	 */
	function handleAddListing() {
		if (!isAuthenticated()) {
			goto(resolve('/auth/login'));
		} else {
			goto(resolve('/listings/new'));
		}
	}

	// Filter states
	let showFilters = $state(false);
	let showTownFilter = $state(false);
	let selectedTown = $state('');
	let minPrice = $state(0);
	let maxPrice = $state(10000000);
	let minBedrooms = $state(0);
	let minBathrooms = $state(0);

	/**
	 * Filter listings based on selected criteria
	 * @param {HouseListing[]} listings
	 * @returns {HouseListing[]}
	 */
	const filterListings = (listings) => {
		return listings.filter((listing) => {
			if (selectedTown && listing.town !== selectedTown) return false;
			if (listing.rent_per_month < minPrice || listing.rent_per_month > maxPrice) return false;
			if (listing.num_bedrooms < minBedrooms) return false;
			if (listing.num_bathrooms < minBathrooms) return false;
			return true;
		});
	};

	/**
	 * Count active filters (excluding town since it has its own button)
	 * @returns {number}
	 */
	let activeFiltersCount = $derived(() => {
		let count = 0;
		if (minPrice > 0) count++;
		if (maxPrice < 10000000) count++;
		if (minBedrooms > 0) count++;
		if (minBathrooms > 0) count++;
		return count;
	});

	/**
	 * Reset all filters
	 */
	function resetFilters() {
		selectedTown = '';
		minPrice = 0;
		maxPrice = 10000000;
		minBedrooms = 0;
		minBathrooms = 0;
	}
</script>

<div>
	<header>
		<nav>
			<h6 class="max">البيت بيتك</h6>
		</nav>
	</header>

	<!-- Filter Buttons -->
	<div class="mb-4 flex items-center justify-between gap-2">
		<div class="flex flex-1 gap-2">
			<!-- Town Filter Button -->
			<div class="relative">
				<button
					onclick={() => (showTownFilter = !showTownFilter)}
					class="btn gap-2 btn-outline btn-sm"
				>
					<House size={16} />
					{selectedTown ? getTownNameArabic(selectedTown) : 'المنطقة'}
				</button>
				{#if showTownFilter}
					<!-- Dropdown overlay to close on outside click -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
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
										selectedTown = '';
										showTownFilter = false;
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
											selectedTown = town;
											showTownFilter = false;
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

		{#await data.listings then listings}
			{#if !listings.error}
				{filterListings(listings.data).length} عقار
			{/if}
		{/await}
	</div>

	<!-- Filters Drawer -->
	{#if showFilters}
		<!-- Overlay -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
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

	<div id="listings-grid" class="flex flex-wrap justify-center gap-4">
		{#await data.listings}
			<div class="flex items-center justify-center" style="min-height: calc(100vh - 20rem);">
				<beer-css>
					<div class="shape loading-indicator extra"></div>
				</beer-css>
			</div>
		{:then listings}
			{#if !listings.error}
				{#each filterListings(listings.data) as listing (listing.id)}
					<ListingCard {listing} />
				{:else}
					<div class="text-center py-12">
						<p class="text-lg text-base-content/60">لا توجد نتائج تطابق معايير البحث</p>
					</div>
				{/each}
			{:else}
				<div class="py-12 text-center">
					<p class="text-lg text-base-content/60">
						<!-- TODO: translate into Arabic -->
						Ran into an error. Please contact the system administrator. error: {listings.error}
					</p>
				</div>
			{/if}
		{/await}
	</div>

	{#if !showFilters}
		<beer-css>
			<button
				id="new-post-fab"
				class="square extra fixed bottom-22 left-2"
				onclick={handleAddListing}
				aria-label="إضافة إعلان"
			>
				<i>add</i>
			</button>
		</beer-css>
	{/if}
</div>
