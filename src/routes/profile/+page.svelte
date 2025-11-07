<script>
	import {
		isAuthenticated,
		getUser,
		getProfileData,
		getProfilePicUrl,
		signOut
	} from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import 'beercss/custom-element';
	import Avatar from '$lib/components/Avatar.svelte';

	let loading = $state(true);

	// Redirect if not authenticated
	onMount(() => {
		if (!isAuthenticated()) {
			goto(resolve('/auth/login'));
		} else {
			loading = false;
		}
	});

	/**
	 * Handle logout
	 */
	async function handleLogout() {
		await signOut();
		goto(resolve('/'));
	}

	// Reactive getters for user and profile data
	let user = $derived(getUser());
	let profileData = $derived(getProfileData());
	let profilePicUrl = $derived(getProfilePicUrl());
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="shape loading-indicator extra"></div>
	</div>
{:else}
	<div id="page" dir="rtl">
		<header>
			<nav>
				<h6>الملف الشخصي</h6>
			</nav>
		</header>

		<Avatar name={profileData} {profilePicUrl} />

		<ul id="user-info" class="medium-space list">
			<li id="name">
				<i>id_card</i>
				<div class="max">
					<h6 class="small">الاسم</h6>
					<div>
						{profileData?.first_name || ''}
						{profileData?.last_name || ''}
					</div>
				</div>
			</li>
			<li id="email">
				<i>mail</i>
				<div class="max">
					<h6 class="small">البريد الإلكتروني</h6>
					<div>
						{user?.email || ''}
					</div>
				</div>
			</li>
		</ul>

		<div class="grid">
			<a id="edit-profile" href={resolve('/profile/edit')} class="button responsive s12 m6 l4">
				<i>edit</i>
				<span>تعديل الملف الشخصي</span>
			</a>

			<a id="my-lists" href={resolve('/profile/listings')} class="responsive button s12 m6 l4">
				<i>other_houses</i>
				<span>إعلاناتي</span>
			</a>

			<button id="logout-button" onclick={handleLogout} class="button responsive s12 m6 l4">
				<i>logout</i>
				<span>تسجيل الخروج</span>
			</button>
		</div>
	</div>
{/if}
