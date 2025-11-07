<script>
	import '../app.css';
	import { initAuth } from '$lib/stores/authStore.svelte.js';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import 'beercss';

	let { children } = $props();

	onMount(() => {
		const authListener = initAuth();
		return () => {
			authListener?.subscription?.unsubscribe();
		};
	});

	// Hide bottom nav on auth pages
	let showBottomNav = $derived(!page.url.pathname.startsWith('/auth'));
</script>

<div id="layout">
	{#if showBottomNav}
		<BottomNav />
	{/if}

	<main class="responsive">
		{@render children?.()}
	</main>
</div>
