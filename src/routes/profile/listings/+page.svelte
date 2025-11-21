<script>
	import { getTownNameArabic, towns } from '$lib/towns.js';
	import { isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ListingCard from '$lib/components/ListingCard.svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import 'beercss';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// Check authentication
	onMount(() => {
		if (!isAuthenticated()) {
			goto(resolve('/auth/login'));
		}
	});

	// Read current filters from URL
	let selectedTowns = /** @type {import('$lib/towns.js').Town[]} */ (
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
</script>

<header class="fixed">
	<nav>
		<a href={resolve('/profile')} class="circle transparent">
			<i>arrow_forward</i>
		</a>
		<h6 class="max select-none">إعلاناتي</h6>

		<nav class="group split">
			<!-- Region Filter Button -->
			<button class="transparent left-round" data-ui="#region-dialog">
				<i>location_city</i>
				<span>المنطقة</span>
				{#if selectedTowns.length > 0}
					<div class="badge top left">{selectedTowns.length}</div>
				{/if}
			</button>

			<!-- Other Filters Button -->
			<button class="circle transparent right-round" data-ui="#filters-dialog">
				<i>tune</i>
				{#if currentMinPrice || currentMaxPrice || currentNumBedrooms || currentNumBathrooms}
					<div class="badge top left">
						{(currentMinPrice ? 1 : 0) +
							(currentMaxPrice ? 1 : 0) +
							(currentNumBedrooms ? 1 : 0) +
							(currentNumBathrooms ? 1 : 0)}
					</div>
				{/if}
			</button>
		</nav>
	</nav>
</header>

<main class="responsive">
	{#if data.listings.length === 0}
		<div class="center-align middle-align" style="min-height: 60vh;">
			<div>
				<i class="extra">home</i>
				<h5>لم تقم بنشر أي إعلانات بعد</h5>
				<p>ابدأ بإضافة إعلان جديد</p>
			</div>
		</div>
	{:else}
		<div id="listings-grid" class="flex flex-wrap justify-center gap-4">
			{#each data.listings as listing (listing.id)}
				<ListingCard {listing} />
			{/each}
		</div>
	{/if}

	<!-- FAB -->
	<a href={resolve('/listings/new')} class="circle extra primary fixed bottom right">
		<i>add</i>
	</a>
</main>

<!-- Town Filter Dialog -->
<dialog id="region-dialog" class="bottom">
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
	<div class="small-space"></div>
	<nav>
		<button class="border" data-ui="#region-dialog" onclick={resetTownFilters}>
			إعادة تعيين
		</button>
		<button data-ui="#region-dialog" onclick={applyTownFilters}>تطبيق</button>
	</nav>
</dialog>

<!-- Other Filters Dialog -->
<dialog id="filters-dialog" class="bottom">
	<h5>الفلاتر</h5>
	<div class="small-space"></div>

	<div class="scroll">
		<!-- Price Range -->
		<h6 class="small">السعر (ل.س شهرياً)</h6>
		<div class="grid">
			<div class="s6">
				<div class="field label border">
					<input type="number" bind:value={tempMinPrice} placeholder=" " min="0" />
					<label>من</label>
				</div>
			</div>
			<div class="s6">
				<div class="field label border">
					<input type="number" bind:value={tempMaxPrice} placeholder=" " min="0" />
					<label>إلى</label>
				</div>
			</div>
		</div>

		<div class="small-space"></div>

		<!-- Bedrooms -->
		<h6 class="small">عدد غرف النوم</h6>
		<div class="field label border">
			<input type="number" bind:value={tempNumBedrooms} placeholder=" " min="0" />
			<label>عدد غرف النوم</label>
		</div>

		<div class="small-space"></div>

		<!-- Bathrooms -->
		<h6 class="small">عدد الحمامات</h6>
		<div class="field label border">
			<input type="number" bind:value={tempNumBathrooms} placeholder=" " min="0" />
			<label>عدد الحمامات</label>
		</div>
	</div>

	<div class="small-space"></div>
	<nav>
		<button class="border" data-ui="#filters-dialog" onclick={resetOtherFilters}>
			إعادة تعيين
		</button>
		<button data-ui="#filters-dialog" onclick={applyOtherFilters}>تطبيق</button>
	</nav>
</dialog>
