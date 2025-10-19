<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic, townNamesArabic } from '$lib/towns.js';
	import { getUser, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Upload, X, Plus, ArrowRight, Loader } from 'lucide-svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// Check authentication
	onMount(() => {
		if (!isAuthenticated()) {
			goto(resolve('/auth/login'));
		}
	});

	// Form state
	let town = $state('');
	let rentPerMonth = $state('');
	let rentInUsd = $state(false);
	let sizeM2 = $state('');
	let numBedrooms = $state(1);
	let numBathrooms = $state(1);
	let address = $state('');
	let sourceUrl = $state('');
	let phoneNumber = $state('');
	let whatsappComm = $state(true);

	/** @type {File[]} */
	let selectedFiles = $state([]);
	/** @type {string[]} */
	let previewUrls = $state([]);

	let isSubmitting = $state(false);
	let errorMessage = $state('');

	/**
	 * Handle file selection
	 * @param {Event} event
	 */
	function handleFileSelect(event) {
		const target = /** @type {HTMLInputElement} */ (event.target);
		const files = target.files;
		if (!files) return;

		const newFiles = Array.from(files);
		selectedFiles = [...selectedFiles, ...newFiles];

		// Create preview URLs
		newFiles.forEach((file) => {
			const url = URL.createObjectURL(file);
			previewUrls = [...previewUrls, url];
		});
	}

	/**
	 * Remove a file from selection
	 * @param {number} index
	 */
	function removeFile(index) {
		// Revoke the object URL to free memory
		URL.revokeObjectURL(previewUrls[index]);

		selectedFiles = selectedFiles.filter((_, i) => i !== index);
		previewUrls = previewUrls.filter((_, i) => i !== index);
	}

	/**
	 * Upload images to Supabase storage
	 * @returns {Promise<string[]>} Array of uploaded file paths
	 */
	async function uploadImages() {
		const uploadedPaths = [];

		for (const file of selectedFiles) {
			// Generate unique file name
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
			const filePath = fileName;

			const { data, error } = await supabase.storage
				.from('house_pics')
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: false
				});

			if (error) {
				throw error;
			}

			if (data) {
				uploadedPaths.push(data.path);
			}
		}

		return uploadedPaths;
	}

	/**
	 * Handle form submission
	 */
	async function handleSubmit() {
		errorMessage = '';

		// Validation
		if (!town || !rentPerMonth || !sizeM2 || !address) {
			errorMessage = 'الرجاء ملء جميع الحقول المطلوبة';
			return;
		}

		if (selectedFiles.length === 0) {
			errorMessage = 'الرجاء إضافة صورة واحدة على الأقل';
			return;
		}

		isSubmitting = true;

		try {
			const user = getUser();
			if (!user) {
				errorMessage = 'يجب تسجيل الدخول لإنشاء إعلان';
				return;
			}

			// Upload images first
			const imagePaths = await uploadImages();

			// Create listing
			const { data: listing, error: listingError } = await supabase
				.from('house_listings')
				.insert({
					town,
					rent_per_month: parseInt(rentPerMonth),
					rent_in_usd: rentInUsd,
					author: user.id,
					size_m2: parseInt(sizeM2),
					num_bedrooms: parseInt(numBedrooms),
					num_bathrooms: parseInt(numBathrooms),
					address,
					source_url: sourceUrl || null,
					phone_number: phoneNumber || null,
					whatsapp_comm: whatsappComm
				})
				.select()
				.single();

			if (listingError) {
				throw listingError;
			}

			// Insert listing to pic relationships
			const listingToPicEntries = imagePaths.map((picPath) => ({
				listing_id: listing.id,
				pic_name: picPath
			}));

			const { error: picError } = await supabase
				.from('listing_to_pic')
				.insert(listingToPicEntries);

			if (picError) {
				throw picError;
			}

			// Success! Redirect to home page
			goto(resolve('/'));
		} catch (error) {
			console.error('Error creating listing:', error);
			errorMessage = `حدث خطأ أثناء إنشاء الإعلان: ${error.message}`;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-base-200 pb-24" dir="rtl">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-base-100 p-4 shadow-sm">
		<div class="flex items-center gap-3">
			<a href={resolve('/')} class="btn btn-circle btn-ghost btn-sm">
				<ArrowRight size={20} />
			</a>
			<h1 class="text-xl font-bold">إضافة إعلان جديد</h1>
		</div>
	</div>

	<!-- Form -->
	<div class="container mx-auto max-w-2xl p-4">
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			<!-- Town Selection -->
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-4">
					<h2 class="card-title text-base">المنطقة *</h2>
					<select
						bind:value={town}
						class="select-bordered select w-full"
						required
					>
						<option value="" disabled>اختر المنطقة</option>
						{#each Object.keys(townNamesArabic) as townKey}
							<option value={townKey}>{getTownNameArabic(townKey)}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Rent -->
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-4">
					<h2 class="card-title text-base">الإيجار الشهري *</h2>
					<div class="space-y-3">
						<input
							type="number"
							bind:value={rentPerMonth}
							placeholder="مثال: 500000"
							class="input-bordered input w-full"
							required
							min="1"
						/>
						<div class="form-control">
							<label class="label cursor-pointer justify-start gap-3">
								<input
									type="checkbox"
									bind:checked={rentInUsd}
									class="checkbox"
								/>
								<span class="label-text">الإيجار بالدولار الأمريكي</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- Property Details -->
			<div class="card bg-base-100 shadow-md">
				<div class="card-body space-y-3 p-4">
					<h2 class="card-title text-base">تفاصيل العقار</h2>

					<!-- Size -->
					<div class="form-control">
						<label class="label" for="size">
							<span class="label-text">المساحة (م²) *</span>
						</label>
						<input
							id="size"
							type="number"
							bind:value={sizeM2}
							placeholder="مثال: 120"
							class="input-bordered input"
							required
							min="1"
						/>
					</div>

					<!-- Bedrooms -->
					<div class="form-control">
						<label class="label" for="bedrooms">
							<span class="label-text">عدد غرف النوم *</span>
						</label>
						<input
							id="bedrooms"
							type="number"
							bind:value={numBedrooms}
							class="input-bordered input"
							required
							min="0"
						/>
					</div>

					<!-- Bathrooms -->
					<div class="form-control">
						<label class="label" for="bathrooms">
							<span class="label-text">عدد الحمامات *</span>
						</label>
						<input
							id="bathrooms"
							type="number"
							bind:value={numBathrooms}
							class="input-bordered input"
							required
							min="0"
						/>
					</div>
				</div>
			</div>

			<!-- Address -->
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-4">
					<h2 class="card-title text-base">العنوان *</h2>
					<textarea
						bind:value={address}
						placeholder="أدخل العنوان التفصيلي للعقار"
						class="textarea-bordered textarea w-full"
						rows="3"
						required
					></textarea>
				</div>
			</div>

			<!-- Contact Information -->
			<div class="card bg-base-100 shadow-md">
				<div class="card-body space-y-3 p-4">
					<h2 class="card-title text-base">معلومات التواصل</h2>

					<!-- Phone Number -->
					<div class="form-control">
						<label class="label" for="phone">
							<span class="label-text">رقم الهاتف</span>
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={phoneNumber}
							placeholder="مثال: +963123456789"
							class="input-bordered input"
						/>
					</div>

					{#if phoneNumber}
						<div class="form-control">
							<label class="label cursor-pointer justify-start gap-3">
								<input
									type="checkbox"
									bind:checked={whatsappComm}
									class="checkbox"
								/>
								<span class="label-text">التواصل عبر واتساب</span>
							</label>
						</div>
					{/if}

					<!-- Source URL -->
					<div class="form-control">
						<label class="label" for="source">
							<span class="label-text">رابط المصدر (اختياري)</span>
						</label>
						<input
							id="source"
							type="url"
							bind:value={sourceUrl}
							placeholder="مثال: https://facebook.com/..."
							class="input-bordered input"
						/>
					</div>
				</div>
			</div>

			<!-- Images -->
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-4">
					<h2 class="card-title text-base">الصور *</h2>

					<!-- File Input -->
					<label class="btn btn-outline w-full">
						<Upload size={20} />
						إضافة صور
						<input
							type="file"
							accept="image/*"
							multiple
							onchange={handleFileSelect}
							class="hidden"
						/>
					</label>

					<!-- Preview Grid -->
					{#if previewUrls.length > 0}
						<div class="mt-3 grid grid-cols-3 gap-2">
							{#each previewUrls as url, index}
								<div class="relative aspect-square">
									<img
										src={url}
										alt="معاينة الصورة {index + 1}"
										class="h-full w-full rounded-lg object-cover"
									/>
									<button
										type="button"
										onclick={() => removeFile(index)}
										class="btn btn-circle btn-error absolute -left-2 -top-2 btn-xs"
									>
										<X size={14} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Error Message -->
			{#if errorMessage}
				<div class="alert alert-error">
					<span>{errorMessage}</span>
				</div>
			{/if}

			<!-- Submit Button -->
			<button
				type="submit"
				disabled={isSubmitting}
				class="btn btn-primary w-full"
			>
				{#if isSubmitting}
					<Loader size={20} class="animate-spin" />
					جاري النشر...
				{:else}
					<Plus size={20} />
					نشر الإعلان
				{/if}
			</button>
		</form>
	</div>
</div>
