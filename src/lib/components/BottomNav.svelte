<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Home, User } from 'lucide-svelte';
	import {
		isAuthenticated,
		getProfileData,
		getProfilePicUrl
	} from '$lib/stores/authStore.svelte.js';

	/**
	 * Handle profile navigation
	 */
	function handleProfileClick() {
		if (isAuthenticated()) {
			goto(resolve('/profile'));
		} else {
			goto(resolve('/auth/login'));
		}
	}

	// Reactive values
	let currentPath = $derived(page.url.pathname);
	let profileData = $derived(getProfileData());
	let profilePicUrl = $derived(getProfilePicUrl());
</script>

<div class="dock fixed right-0 bottom-0 left-0 z-50 border-t border-base-300 bg-base-100" dir="rtl">
	<!-- Home -->
	<a href={resolve('/')} class={currentPath === '/' ? 'dock-active' : ''}>
		<Home size={24} />
		<span class="dock-label">الرئيسية</span>
	</a>

	<!-- Profile -->
	<button onclick={handleProfileClick} class={currentPath === '/profile' ? 'dock-active' : ''}>
		{#if isAuthenticated() && profilePicUrl}
			<!-- User has profile picture -->
			<div class="avatar">
				<div class="w-8 rounded-full">
					<img src={profilePicUrl} alt="صورة الملف الشخصي" />
				</div>
			</div>
		{:else if isAuthenticated() && profileData}
			<!-- User is authenticated but no profile picture - show initials -->
			<div class="placeholder avatar">
				<div
					class="flex w-8 items-center justify-center rounded-full bg-primary text-primary-content"
				>
					<span class="text-xs">
						{profileData.first_name?.[0] || 'م'}{profileData.last_name?.[0] || 'أ'}
					</span>
				</div>
			</div>
		{:else}
			<!-- User is not authenticated - show default icon -->
			<div class="placeholder avatar">
				<div class="flex w-8 items-center justify-center rounded-full bg-base-300">
					<User size={16} />
				</div>
			</div>
		{/if}
		<span class="dock-label">الملف الشخصي</span>
	</button>
</div>
