<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic, townNamesArabic } from '$lib/towns.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Upload, X, Save, ArrowRight, Loader, Trash2 } from 'lucide-svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// Form state - Initialize with existing data
	let town = $state(data.listing.town);
	let rentPerMonth = $state(data.listing.rent_per_month.toString());
	let rentInUsd = $state(data.listing.rent_in_usd);
	let sizeM2 = $state(data.listing.size_m2.toString());
	let numBedrooms = $state(data.listing.num_bedrooms);
	let numBathrooms = $state(data.listing.num_bathrooms);
	let address = $state(data.listing.address);
	let sourceUrl = $state(data.listing.source_url || '');
	let phoneNumber = $state(data.listing.phone_number || '');
	let whatsappComm = $state(data.listing.whatsapp_comm);

	// Existing images from the listing
	/** @type {Array<{pic_name: string}>} */
	let existingImages = $state(data.listing.listing_to_pic ? [...data.listing.listing_to_pic] : []);

	// New files to upload
	/** @type {File[]} */
	let newFiles = $state([]);
	/** @type {string[]} */
	let newPreviewUrls = $state([]);

	let isSubmitting = $state(false);
	let errorMessage = $state('');

	/**
	 * Get public URL for an existing image from Supabase storage
	 * @param {string} picName
	 * @returns {string}
	 */
	function getImageUrl(picName) {
		const { data } = supabase.storage.from('house_pics').getPublicUrl(picName);
		return data.publicUrl;
	}

	/**
	 * Handle new file selection
	 * @param {Event} event
	 */
	function handleFileSelect(event) {
		const target = /** @type {HTMLInputElement} */ (event.target);
		const files = target.files;
		if (!files) return;

		const selectedFiles = Array.from(files);
		newFiles = [...newFiles, ...selectedFiles];

		// Create preview URLs
		selectedFiles.forEach((file) => {
			const url = URL.createObjectURL(file);
			newPreviewUrls = [...newPreviewUrls, url];
		});
	}

	/**
	 * Remove an existing image
	 * @param {number} index
	 */
	function removeExistingImage(index) {
		existingImages = existingImages.filter((_, i) => i !== index);
	}

	/**
	 * Remove a new file from selection
	 * @param {number} index
	 */
	function removeNewFile(index) {
		// Revoke the object URL to free memory
		URL.revokeObjectURL(newPreviewUrls[index]);

		newFiles = newFiles.filter((_, i) => i !== index);
		newPreviewUrls = newPreviewUrls.filter((_, i) => i !== index);
	}

	/**
	 * Upload new images to Supabase storage
	 * @returns {Promise<string[]>} Array of uploaded file paths
	 */
	async function uploadImages() {
		const uploadedPaths = [];

		for (const file of newFiles) {
			// Generate unique file name
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
			const filePath = fileName;

			const { data, error } = await supabase.storage.from('house_pics').upload(filePath, file, {
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

		const totalImages = existingImages.length + newFiles.length;
		if (totalImages === 0) {
			errorMessage = 'الرجاء إضافة صورة واحدة على الأقل';
			return;
		}

		isSubmitting = true;

		try {
			// Upload new images if any
			const newImagePaths = await uploadImages();

			// Update listing
			const { error: listingError } = await supabase
				.from('house_listings')
				.update({
					town,
					rent_per_month: parseInt(rentPerMonth),
					rent_in_usd: rentInUsd,
					size_m2: parseInt(sizeM2),
					num_bedrooms: parseInt(numBedrooms),
					num_bathrooms: parseInt(numBathrooms),
					address,
					source_url: sourceUrl || null,
					phone_number: phoneNumber || null,
					whatsapp_comm: whatsappComm
				})
				.eq('id', data.listing.id);

			if (listingError) {
				throw listingError;
			}

			// Get the original images from the database
			const { data: originalListing } = await supabase
				.from('house_listings')
				.select('listing_to_pic (pic_name)')
				.eq('id', data.listing.id)
				.single();

			// Find images that were removed
			const originalPicNames = originalListing?.listing_to_pic?.map((p) => p.pic_name) || [];
			const currentPicNames = existingImages.map((img) => img.pic_name);
			const removedPicNames = originalPicNames.filter(
				(picName) => !currentPicNames.includes(picName)
			);

			// Delete removed image entries from listing_to_pic
			if (removedPicNames.length > 0) {
				const { error: deleteError } = await supabase
					.from('listing_to_pic')
					.delete()
					.eq('listing_id', data.listing.id)
					.in('pic_name', removedPicNames);

				if (deleteError) {
					console.error('Error deleting image references:', deleteError);
				}

				// Also delete the actual files from storage
				const { error: storageDeleteError } = await supabase.storage
					.from('house_pics')
					.remove(removedPicNames);

				if (storageDeleteError) {
					console.error('Error deleting images from storage:', storageDeleteError);
				}
			}

			// Insert new image relationships
			if (newImagePaths.length > 0) {
				const listingToPicEntries = newImagePaths.map((picPath) => ({
					listing_id: data.listing.id,
					pic_name: picPath
				}));

				const { error: picError } = await supabase
					.from('listing_to_pic')
					.insert(listingToPicEntries);

				if (picError) {
					throw picError;
				}
			}

			// Success! Redirect to listing page
			goto(resolve(`/listings/${data.listing.id}`));
		} catch (error) {
			console.error('Error updating listing:', error);
			errorMessage = `حدث خطأ أثناء تحديث الإعلان: ${error.message}`;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-base-200 pb-24" dir="rtl">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-base-100 p-4 shadow-sm">
		<div class="flex items-center gap-3">
			<a href={resolve(`/listings/${data.listing.id}`)} class="btn btn-circle btn-ghost btn-sm">
				<ArrowRight size={20} />
			</a>
			<h1 class="text-xl font-bold">تعديل الإعلان</h1>
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
			<!-- Town Selection -->
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-4">
					<h2 class="card-title text-base">المنطقة *</h2>
					<select bind:value={town} class="select-bordered select w-full" required>
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
								<input type="checkbox" bind:checked={rentInUsd} class="checkbox" />
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
								<input type="checkbox" bind:checked={whatsappComm} class="checkbox" />
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

					<!-- Existing Images -->
					{#if existingImages.length > 0}
						<div class="mb-3">
							<p class="mb-2 text-sm text-base-content/70">الصور الحالية:</p>
							<div class="grid grid-cols-3 gap-2">
								{#each existingImages as img, index}
									<div class="relative aspect-square">
										<img
											src={getImageUrl(img.pic_name)}
											alt="صورة موجودة {index + 1}"
											class="h-full w-full rounded-lg object-cover"
										/>
										<button
											type="button"
											onclick={() => removeExistingImage(index)}
											class="btn absolute -top-2 -left-2 btn-circle btn-xs btn-error"
										>
											<X size={14} />
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- File Input -->
					<label class="btn w-full btn-outline">
						<Upload size={20} />
						إضافة صور جديدة
						<input
							type="file"
							accept="image/*"
							multiple
							onchange={handleFileSelect}
							class="hidden"
						/>
					</label>

					<!-- New Images Preview -->
					{#if newPreviewUrls.length > 0}
						<div class="mt-3">
							<p class="mb-2 text-sm text-base-content/70">صور جديدة:</p>
							<div class="grid grid-cols-3 gap-2">
								{#each newPreviewUrls as url, index}
									<div class="relative aspect-square">
										<img
											src={url}
											alt="صورة جديدة {index + 1}"
											class="h-full w-full rounded-lg object-cover"
										/>
										<button
											type="button"
											onclick={() => removeNewFile(index)}
											class="btn absolute -top-2 -left-2 btn-circle btn-xs btn-error"
										>
											<X size={14} />
										</button>
									</div>
								{/each}
							</div>
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
			<button type="submit" disabled={isSubmitting} class="btn w-full btn-primary">
				{#if isSubmitting}
					<Loader size={20} class="animate-spin" />
					جاري التحديث...
				{:else}
					<Save size={20} />
					حفظ التعديلات
				{/if}
			</button>
		</form>
	</div>
</div>
