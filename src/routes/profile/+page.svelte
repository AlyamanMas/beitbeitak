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
	import { User, Mail, LogOut, Home, Edit } from 'lucide-svelte';

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
	<div class="flex min-h-screen items-center justify-center bg-base-200">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:else}
	<div class="min-h-screen bg-base-200 pb-24" dir="rtl">
		<div class="container mx-auto max-w-2xl p-4">
			<!-- Header -->
			<div class="mb-6">
				<h1 class="text-3xl font-bold">الملف الشخصي</h1>
			</div>

			<!-- Profile Card -->
			<div class="mb-4 rounded-lg bg-base-100 p-6 shadow-md">
				<!-- Avatar Section -->
				<div class="mb-6 flex items-center justify-center">
					<div class="placeholder avatar">
						<div
							class="w-24 rounded-full {profilePicUrl
								? 'ring ring-primary ring-offset-2 ring-offset-base-100'
								: 'bg-primary text-primary-content'} flex items-center justify-center"
						>
							{#if profilePicUrl}
								<img src={profilePicUrl} alt="الصورة الشخصية" />
							{:else}
								<span class="text-3xl">
									{profileData?.first_name?.[0] || 'م'}{profileData?.last_name?.[0] || 'أ'}
								</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- User Info -->
				<div class="space-y-4">
					<!-- Name -->
					<div class="flex items-center gap-3 border-b border-base-300 pb-3">
						<User size={20} class="text-base-content/60" />
						<div class="flex-1">
							<p class="text-sm text-base-content/60">الاسم</p>
							<p class="font-semibold">
								{profileData?.first_name || ''}
								{profileData?.last_name || ''}
							</p>
						</div>
					</div>

					<!-- Email -->
					<div class="flex items-center gap-3 border-b border-base-300 pb-3">
						<Mail size={20} class="text-base-content/60" />
						<div class="flex-1">
							<p class="text-sm text-base-content/60">البريد الإلكتروني</p>
							<p class="font-semibold">{user?.email || ''}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="space-y-2">
				<!-- Edit Profile Button -->
				<a href={resolve('/profile/edit')} class="btn w-full gap-2 btn-outline">
					<Edit size={20} />
					تعديل الملف الشخصي
				</a>

				<!-- My Listings Button -->
				<a href={resolve('/profile/listings')} class="btn w-full gap-2 btn-primary">
					<Home size={20} />
					إعلاناتي
				</a>

				<!-- Logout Button -->
				<button onclick={handleLogout} class="btn w-full gap-2 btn-error">
					<LogOut size={20} />
					تسجيل الخروج
				</button>
			</div>
		</div>
	</div>
{/if}
