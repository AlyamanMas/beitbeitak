<script>
	import { isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { House, ArrowRight, Plus } from 'lucide-svelte';
	import ListingCard from '$lib/components/ListingCard.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// Check authentication
	onMount(() => {
		if (!isAuthenticated()) {
			goto(resolve('/auth/login'));
		}
	});
</script>

<div class="bg-base-200 min-h-screen pb-24" dir="rtl">
	<!-- Header -->
	<div class="bg-base-100 sticky top-0 z-10 p-4 shadow-sm">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href={resolve('/profile')} class="btn btn-circle btn-ghost btn-sm">
					<ArrowRight size={20} />
				</a>
				<h1 class="text-xl font-bold">إعلاناتي</h1>
			</div>
			<a href={resolve('/listings/new')} class="btn btn-sm btn-primary gap-2">
				<Plus size={16} />
				إضافة إعلان
			</a>
		</div>
	</div>

	<!-- Listings -->
	<div class="container mx-auto max-w-4xl p-4">
		{#if data.listings.length === 0}
			<div class="py-12 text-center">
				<div class="mb-4">
					<House size={64} class="text-base-content/30 mx-auto" />
				</div>
				<p class="text-base-content/60 mb-4 text-lg">لم تقم بنشر أي إعلانات بعد</p>
				<a href={resolve('/listings/new')} class="btn btn-primary gap-2">
					<Plus size={20} />
					إضافة إعلان جديد
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4">
				{#each data.listings as listing (listing.id)}
					<ListingCard {listing} />
				{/each}
			</div>
		{/if}
	</div>
</div>
