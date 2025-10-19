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
	import { onMount } from 'svelte';
	import { User, Upload, X, Save, ArrowRight, Loader, Trash2, Camera } from 'lucide-svelte';

	let loading = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Check authentication
	onMount(() => {
		if (!isAuthenticated()) {
			goto('/auth/login');
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
				goto('/profile');
			}, 1500);
		} catch (error) {
			console.error('Error updating profile:', error);
			errorMessage = `حدث خطأ أثناء تحديث الملف الشخصي: ${error.message}`;
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-base-200">
		<span class="loading loading-spinner loading-lg"></span>
	</div>
{:else}
	<div class="min-h-screen bg-base-200 pb-24" dir="rtl">
		<!-- Header -->
		<div class="sticky top-0 z-10 bg-base-100 p-4 shadow-sm">
			<div class="flex items-center gap-3">
				<a href="/profile" class="btn btn-circle btn-ghost btn-sm">
					<ArrowRight size={20} />
				</a>
				<h1 class="text-xl font-bold">تعديل الملف الشخصي</h1>
			</div>
		</div>

		<!-- Form -->
		<div class="container mx-auto max-w-2xl p-4">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<!-- Profile Picture -->
				<div class="card bg-base-100 shadow-md">
					<div class="card-body p-4">
						<h2 class="card-title text-base mb-3">الصورة الشخصية</h2>

						<div class="flex flex-col items-center gap-4">
							<!-- Current or New Picture Preview -->
							<div class="avatar placeholder">
								<div
									class="w-32 rounded-full {newProfilePicPreview ||
									(currentProfilePicUrl && !removeCurrentPic)
										? 'ring ring-primary ring-offset-2 ring-offset-base-100'
										: 'bg-primary text-primary-content'}"
								>
									{#if newProfilePicPreview}
										<!-- New picture preview -->
										<img src={newProfilePicPreview} alt="معاينة الصورة الجديدة" />
									{:else if currentProfilePicUrl && !removeCurrentPic}
										<!-- Current picture -->
										<img src={currentProfilePicUrl} alt="الصورة الشخصية" />
									{:else}
										<!-- Placeholder -->
										<span class="text-4xl">
											{firstName?.[0] || 'م'}{lastName?.[0] || 'أ'}
										</span>
									{/if}
								</div>
							</div>

							<!-- Actions -->
							<div class="flex flex-col w-full gap-2">
								{#if newProfilePicPreview}
									<!-- Cancel new picture -->
									<button
										type="button"
										onclick={cancelNewProfilePic}
										class="btn btn-outline btn-sm gap-2"
									>
										<X size={16} />
										إلغاء الصورة الجديدة
									</button>
								{:else if currentProfilePicUrl && !removeCurrentPic}
									<!-- Remove current picture -->
									<button
										type="button"
										onclick={markForRemoval}
										class="btn btn-error btn-outline btn-sm gap-2"
									>
										<Trash2 size={16} />
										إزالة الصورة الحالية
									</button>
								{:else if removeCurrentPic}
									<!-- Cancel removal -->
									<button
										type="button"
										onclick={cancelRemoval}
										class="btn btn-outline btn-sm gap-2"
									>
										<X size={16} />
										إلغاء الإزالة
									</button>
								{/if}

								<!-- Upload new picture -->
								{#if !newProfilePicPreview}
									<label class="btn btn-primary btn-sm gap-2">
										<Camera size={16} />
										{currentProfilePicUrl && !removeCurrentPic ? 'تغيير الصورة' : 'إضافة صورة'}
										<input
											type="file"
											accept="image/*"
											onchange={handleProfilePicSelect}
											class="hidden"
										/>
									</label>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Name -->
				<div class="card bg-base-100 shadow-md">
					<div class="card-body space-y-3 p-4">
						<h2 class="card-title text-base">الاسم</h2>

						<!-- First Name -->
						<div class="form-control">
							<label class="label" for="firstName">
								<span class="label-text">الاسم الأول *</span>
							</label>
							<input
								id="firstName"
								type="text"
								bind:value={firstName}
								placeholder="الاسم الأول"
								class="input-bordered input"
								required
							/>
						</div>

						<!-- Last Name -->
						<div class="form-control">
							<label class="label" for="lastName">
								<span class="label-text">الاسم الأخير *</span>
							</label>
							<input
								id="lastName"
								type="text"
								bind:value={lastName}
								placeholder="الاسم الأخير"
								class="input-bordered input"
								required
							/>
						</div>
					</div>
				</div>

				<!-- Success Message -->
				{#if successMessage}
					<div class="alert alert-success">
						<span>{successMessage}</span>
					</div>
				{/if}

				<!-- Error Message -->
				{#if errorMessage}
					<div class="alert alert-error">
						<span>{errorMessage}</span>
					</div>
				{/if}

				<!-- Submit Button -->
				<button type="submit" disabled={isSubmitting} class="btn btn-primary w-full gap-2">
					{#if isSubmitting}
						<Loader size={20} class="animate-spin" />
						جاري الحفظ...
					{:else}
						<Save size={20} />
						حفظ التغييرات
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}
