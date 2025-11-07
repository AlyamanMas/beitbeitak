<script>
	import { supabase } from '$lib/supabaseClient.js';
	import {
		isAuthenticated,
		getUser,
		getProfileData,
		getProfilePicUrl,
		refreshProfileData
	} from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let loading = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Check authentication
	onMount(() => {
		if (!isAuthenticated()) {
			goto(resolve('/auth/login'));
		} else {
			loading = false;
		}
	});

	// Reactive getters
	let user = $derived(getUser());
	let profileData = $derived(getProfileData());
	let currentProfilePicUrl = $derived(getProfilePicUrl());

	// Form state
	let firstName = $state('');
	let lastName = $state('');

	// Initialize form with current data
	$effect(() => {
		if (profileData) {
			firstName = profileData.first_name || '';
			lastName = profileData.last_name || '';
		}
	});

	// Profile picture state
	/** @type {File | null} */
	let newProfilePic = $state(null);
	let newProfilePicPreview = $state('');
	let removeCurrentPic = $state(false);

	/**
	 * Handle profile picture selection
	 * @param {Event} event
	 */
	function handleProfilePicSelect(event) {
		const target = /** @type {HTMLInputElement} */ (event.target);
		const file = target.files?.[0];
		if (!file) return;

		newProfilePic = file;
		newProfilePicPreview = URL.createObjectURL(file);
		removeCurrentPic = false; // Cancel removal if selecting new pic
	}

	/**
	 * Remove selected new profile picture
	 */
	function cancelNewProfilePic() {
		if (newProfilePicPreview) {
			URL.revokeObjectURL(newProfilePicPreview);
		}
		newProfilePic = null;
		newProfilePicPreview = '';
	}

	/**
	 * Mark current profile picture for removal
	 */
	function markForRemoval() {
		removeCurrentPic = true;
		cancelNewProfilePic(); // Cancel new pic if marking for removal
	}

	/**
	 * Cancel removal of current profile picture
	 */
	function cancelRemoval() {
		removeCurrentPic = false;
	}

	/**
	 * Upload profile picture to Supabase storage
	 * @returns {Promise<string>} Path to uploaded file
	 */
	async function uploadProfilePicture() {
		if (!newProfilePic || !user) throw new Error('No file or user');

		const fileExt = newProfilePic.name.split('.').pop();
		const fileName = `${user.id}/profile.${fileExt}`;

		const { data, error } = await supabase.storage
			.from('profile_pics')
			.upload(fileName, newProfilePic, {
				cacheControl: '3600',
				upsert: true // Allow overwriting
			});

		if (error) throw error;
		if (!data) throw new Error('Upload failed');

		return data.path;
	}

	/**
	 * Delete current profile picture from storage
	 */
	async function deleteProfilePicture() {
		if (!profileData?.profile_pic) return;

		const { error } = await supabase.storage.from('profile_pics').remove([profileData.profile_pic]);

		if (error) {
			console.error('Error deleting profile picture:', error);
			// Don't throw - continue with update even if delete fails
		}
	}

	/**
	 * Handle form submission
	 */
	async function handleSubmit() {
		errorMessage = '';
		successMessage = '';

		// Validation
		if (!firstName.trim() || !lastName.trim()) {
			errorMessage = 'الرجاء إدخال الاسم الأول والأخير';
			return;
		}

		if (!user) {
			errorMessage = 'يجب تسجيل الدخول';
			return;
		}

		isSubmitting = true;

		try {
			let profilePicPath = profileData?.profile_pic || null;

			// Handle profile picture upload
			if (newProfilePic) {
				// Delete old picture if exists
				if (profileData?.profile_pic) {
					await deleteProfilePicture();
				}
				// Upload new picture
				profilePicPath = await uploadProfilePicture();
			} else if (removeCurrentPic && profileData?.profile_pic) {
				// Remove current picture
				await deleteProfilePicture();
				profilePicPath = null;
			}

			// Update user profile
			const { error: updateError } = await supabase
				.from('users')
				.update({
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					profile_pic: profilePicPath
				})
				.eq('id', user.id);

			if (updateError) throw updateError;

			// Refresh profile data in the store
			await refreshProfileData();

			successMessage = 'تم تحديث الملف الشخصي بنجاح';

			// Redirect after a short delay
			setTimeout(() => {
				goto(resolve('/profile'));
			}, 1500);
		} catch (error) {
			console.error('Error updating profile:', error);
			errorMessage = `حدث خطأ أثناء تحديث الملف الشخصي: ${error.message}`;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<beer-css>
	{#if loading}
		<div class="flex min-h-screen items-center justify-center bg-base-200">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else}
		<header>
			<nav>
				<button class="transparent">
					<a href={resolve('/')}>
						<i>arrow_forward</i>
						<span>العودة إلى القائمة</span>
					</a>
				</button>
			</nav>
		</header>

		<!-- <h4>الصورة الشخصية</h4> -->
		<Avatar
			name={{ first_name: firstName, last_name: lastName }}
			profilePicUrl={newProfilePicPreview || currentProfilePicUrl}
		/>
		<div class="small-space"></div>

		{#if newProfilePicPreview}
			<!-- Cancel new picture -->
			<button onclick={cancelNewProfilePic} class="responsive">
				<i>cancel</i>
				<span> إلغاء الصورة الجديدة </span>
			</button>
		{:else if currentProfilePicUrl && !removeCurrentPic}
			<!-- Remove current picture -->
			<button onclick={markForRemoval} class="responsive">
				<i>delete</i>
				<span> إزالة الصورة الحالية </span>
			</button>
		{:else if removeCurrentPic}
			<!-- Cancel removal -->
			<button onclick={cancelRemoval} class="responsive">
				<i>cancel</i>
				<span> إلغاء الإزالة </span>
			</button>
		{/if}

		<!-- Upload new picture -->
		{#if !newProfilePicPreview}
			<button class="responsive">
				<i>add_a_photo</i>
				<span>
					{currentProfilePicUrl && !removeCurrentPic ? 'تغيير الصورة' : 'إضافة صورة'}
				</span>
				<input type="file" accept="image/*" onchange={handleProfilePicSelect} />
			</button>
		{/if}

		<div id="name">
			<h4 class="card-title text-base">الاسم</h4>

			<div class="field max label">
				<input id="firstName" bind:value={firstName} required />
				<label for="firstName">الاسم الأول *</label>
			</div>

			<div class="field max label">
				<input id="lastName" bind:value={lastName} required />
				<label for="lastName">الاسم الأخير *</label>
			</div>
		</div>

		<div id="success-message" class={['snackbar', successMessage && 'active']}>
			{successMessage}
		</div>

		<div id="error-message" class={['snackbar error', errorMessage && 'active']}>
			{errorMessage}
		</div>

		<button disabled={isSubmitting} onclick={handleSubmit} class="responsive">
			{#if isSubmitting}
				<progress class="circle"></progress>
				<span>جاري الحفظ...</span>
			{:else}
				<i>save</i>
				<span> حفظ التغييرات </span>
			{/if}
		</button>
	{/if}
</beer-css>
