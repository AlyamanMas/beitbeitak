<script>
	import { getTownNameArabic, towns } from '$lib/towns.js';
	import { isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ListingCard from '$lib/components/ListingCard.svelte';
	import 'beercss';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

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

	// Read current filters from URL
	let selectedTowns = /** @type(import('$lib/towns.js').Town[]) */ (
		$derived(page.url.searchParams.getAll('town'))
	);
	let currentMinPrice = $derived(page.url.searchParams.get('minPrice') || '');
	let currentMaxPrice = $derived(page.url.searchParams.get('maxPrice') || '');
	let currentNumBedrooms = $derived(page.url.searchParams.get('numBedrooms') || '');
	let currentNumBathrooms = $derived(page.url.searchParams.get('numBathrooms') || '');

	// Temporary filter states for dialogs (before applying)
	let /** @type {import('$lib/towns.js').Town[]} */ tempSelectedTowns = $state([]);
	let tempMinPrice = $state('');
	let tempMaxPrice = $state('');
	let tempNumBedrooms = $state('');
	let tempNumBathrooms = $state('');

	// Sync temp values with URL params
	$effect(() => {
		tempSelectedTowns = [...selectedTowns];
		tempMinPrice = currentMinPrice;
		tempMaxPrice = currentMaxPrice;
		tempNumBedrooms = currentNumBedrooms;
		tempNumBathrooms = currentNumBathrooms;
	});

	/**
	 * Toggle town selection
	 * @param {import('$lib/towns.js').Town} town
	 */
	function toggleTownSelection(town) {
		const index = tempSelectedTowns.indexOf(town);
		if (index === -1) {
			tempSelectedTowns = [...tempSelectedTowns, town];
		} else {
			tempSelectedTowns = tempSelectedTowns.filter((t) => t !== town);
		}
	}

	/**
	 * Apply town filters
	 */
	function applyTownFilters() {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.delete('town');
		tempSelectedTowns.forEach((town) => params.append('town', town));
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?${params.toString()}`, { replaceState: false, keepFocus: true });
	}

	/**
	 * Apply other filters (price, bedrooms, bathrooms)
	 */
	function applyOtherFilters() {
		const params = new SvelteURLSearchParams(page.url.searchParams);

		// Update price filters
		if (tempMinPrice) {
			params.set('minPrice', tempMinPrice);
		} else {
			params.delete('minPrice');
		}

		if (tempMaxPrice) {
			params.set('maxPrice', tempMaxPrice);
		} else {
			params.delete('maxPrice');
		}

		// Update bedroom filter
		if (tempNumBedrooms) {
			params.set('numBedrooms', tempNumBedrooms);
		} else {
			params.delete('numBedrooms');
		}

		// Update bathroom filter
		if (tempNumBathrooms) {
			params.set('numBathrooms', tempNumBathrooms);
		} else {
			params.delete('numBathrooms');
		}

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?${params.toString()}`, { replaceState: false, keepFocus: true });
	}

	/**
	 * Reset town filters
	 */
	function resetTownFilters() {
		tempSelectedTowns = [];
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.delete('town');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?${params.toString()}`, { replaceState: false, keepFocus: true });
	}

	/**
	 * Reset other filters
	 */
	function resetOtherFilters() {
		tempMinPrice = '';
		tempMaxPrice = '';
		tempNumBedrooms = '';
		tempNumBathrooms = '';
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.delete('minPrice');
		params.delete('maxPrice');
		params.delete('numBedrooms');
		params.delete('numBathrooms');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?${params.toString()}`, { replaceState: false, keepFocus: true });
	}

	/**
	 * Count active filters
	 */
	let activeFiltersCount = $derived(() => {
		let count = 0;
		if (currentMinPrice) count++;
		if (currentMaxPrice) count++;
		if (currentNumBedrooms) count++;
		if (currentNumBathrooms) count++;
		return count;
	});
</script>

<div>
	<header>
		<nav>
			<h6 class="max">البيت بيتك</h6>
			<nav class="group split">
				<button class="left-round transparent" data-ui="#town-dialog">
					<i>location_city</i>
					<span>المنطقة</span>
					{#if selectedTowns.length > 0}
						<div class="badge">{selectedTowns.length}</div>
					{/if}
				</button>
				<button class="right-round square transparent" data-ui="#filters-dialog">
					<i>filter_list</i>
					{#if activeFiltersCount() > 0}
						<div class="badge">{activeFiltersCount()}</div>
					{/if}
				</button>
			</nav>
		</nav>
	</header>

	<dialog id="town-dialog" class="bottom">
		<h5>اختر المناطق</h5>
		<div class="small-space"></div>
		<nav class="vertical scroll">
			{#each towns as town (town)}
				<label class="checkbox">
					<input
						type="checkbox"
						checked={tempSelectedTowns.includes(town)}
						onchange={() => toggleTownSelection(town)}
					/>
					<span>{getTownNameArabic(town)}</span>
				</label>
			{/each}
		</nav>

		<nav>
			<button class="border" data-ui="#town-dialog" onclick={resetTownFilters}>
				إعادة تعيين
			</button>
			<button data-ui="#town-dialog" onclick={applyTownFilters}> تطبيق </button>
		</nav>
	</dialog>

	<dialog id="filters-dialog" class="bottom">
		<h5>تصفية النتائج</h5>

		<!-- Price Range -->
		<div class="field label border">
			<input id="min-price" type="number" placeholder=" " bind:value={tempMinPrice} />
			<label for="min-price">الحد الأدنى للسعر</label>
		</div>

		<div class="field label border">
			<input id="max-price" type="number" placeholder=" " bind:value={tempMaxPrice} />
			<label for="max-price">الحد الأقصى للسعر</label>
		</div>

		<!-- Bedrooms Filter -->
		<div class="field label border">
			<select id="bedrooms" bind:value={tempNumBedrooms}>
				<option value="">أي عدد</option>
				<option value="0">استوديو</option>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="4">4</option>
				<option value="5">5+</option>
			</select>
			<label for="bedrooms">عدد غرف النوم</label>
		</div>

		<!-- Bathrooms Filter -->
		<div class="field label border">
			<select id="bathrooms" bind:value={tempNumBathrooms}>
				<option value="">أي عدد</option>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="4">4</option>
				<option value="5">5+</option>
			</select>
			<label for="bathrooms">عدد الحمامات</label>
		</div>

		<nav>
			<button class="border" data-ui="#filters-dialog" onclick={resetOtherFilters}>
				إعادة تعيين
			</button>
			<button data-ui="#filters-dialog" onclick={applyOtherFilters}>تطبيق</button>
		</nav>
	</dialog>

	<div id="listings-grid" class="flex flex-wrap justify-center gap-4">
		{#await data.listings}
			<div class="flex items-center justify-center" style="min-height: calc(100vh - 20rem);">
				<div class="shape loading-indicator extra"></div>
			</div>
		{:then listings}
			{#if !listings.error}
				{#if listings.data && listings.data.length > 0}
					{#each listings.data as listing (listing.id)}
						<ListingCard {listing} />
					{/each}
				{:else}
					<div class="py-12 text-center">
						<p class="text-lg">لا توجد نتائج تطابق معايير البحث</p>
					</div>
				{/if}
			{:else}
				<div class="py-12 text-center">
					<p class="text-lg">حدث خطأ. يرجى التواصل مع مدير النظام.</p>
				</div>
			{/if}
		{/await}
	</div>

	<button
		id="new-post-fab"
		class="square extra fixed bottom-22 left-2"
		onclick={handleAddListing}
		aria-label="إضافة إعلان"
	>
		<i>add</i>
	</button>
</div>
