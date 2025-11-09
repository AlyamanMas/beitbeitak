<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic, towns } from '$lib/towns.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

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

<header class="fixed">
	<nav>
		<a href={resolve(`/listings/${data.listing.id}`)} class="circle transparent">
			<i>arrow_forward</i>
		</a>
		<h6 class="max">تعديل الإعلان</h6>
	</nav>
</header>

<main class="responsive">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<ul class="list border no-space">
			<!-- Town Selection -->
			<li>
				<div class="max">
					<h6 class="small">المنطقة *</h6>
					<div class="field label border">
						<select bind:value={town} required>
							<option value="" disabled>اختر المنطقة</option>
							{#each towns as townKey (townKey)}
								<option value={townKey}>{getTownNameArabic(townKey)}</option>
							{/each}
						</select>
						<label>المنطقة</label>
					</div>
				</div>
			</li>

			<!-- Rent -->
			<li>
				<div class="max">
					<h6 class="small">الإيجار الشهري *</h6>
					<div class="field label border">
						<input type="number" bind:value={rentPerMonth} placeholder=" " required min="1" />
						<label>الإيجار الشهري</label>
					</div>
					<label class="checkbox">
						<input type="checkbox" bind:checked={rentInUsd} />
						<span>الإيجار بالدولار الأمريكي</span>
					</label>
				</div>
			</li>

			<!-- Property Details -->
			<li>
				<div class="max">
					<h6 class="small">تفاصيل العقار</h6>

					<!-- Size -->
					<div class="field label border">
						<input id="size" type="number" bind:value={sizeM2} placeholder=" " required min="1" />
						<label for="size">المساحة (م²) *</label>
					</div>

					<!-- Bedrooms -->
					<div class="field label border">
						<input
							id="bedrooms"
							type="number"
							bind:value={numBedrooms}
							placeholder=" "
							required
							min="0"
						/>
						<label for="bedrooms">عدد غرف النوم *</label>
					</div>

					<!-- Bathrooms -->
					<div class="field label border">
						<input
							id="bathrooms"
							type="number"
							bind:value={numBathrooms}
							placeholder=" "
							required
							min="0"
						/>
						<label for="bathrooms">عدد الحمامات *</label>
					</div>
				</div>
			</li>

			<!-- Address -->
			<li>
				<div class="max">
					<h6 class="small">العنوان *</h6>
					<div class="field textarea label border">
						<textarea bind:value={address} placeholder=" " rows="3" required></textarea>
						<label>العنوان التفصيلي للعقار</label>
					</div>
				</div>
			</li>

			<!-- Contact Information -->
			<li>
				<div class="max">
					<h6 class="small">معلومات التواصل</h6>

					<!-- Phone Number -->
					<div class="field label border">
						<input id="phone" type="tel" bind:value={phoneNumber} placeholder=" " />
						<label for="phone">رقم الهاتف</label>
					</div>

					{#if phoneNumber}
						<label class="checkbox">
							<input type="checkbox" bind:checked={whatsappComm} />
							<span>التواصل عبر واتساب</span>
						</label>
					{/if}

					<!-- Source URL -->
					<div class="field label border">
						<input id="source" type="url" bind:value={sourceUrl} placeholder=" " />
						<label for="source">رابط المصدر (اختياري)</label>
					</div>
				</div>
			</li>

			<!-- Images -->
			<li>
				<div class="max">
					<h6 class="small">الصور *</h6>

					<!-- Existing Images -->
					{#if existingImages.length > 0}
						<p class="small-text">الصور الحالية:</p>
						<div class="grid">
							{#each existingImages as img, index (index)}
								<div class="s4 m3 l2">
									<div style="position: relative; aspect-ratio: 1;">
										<img
											src={getImageUrl(img.pic_name)}
											alt="صورة موجودة {index + 1}"
											class="round responsive"
											style="width: 100%; height: 100%; object-fit: cover;"
										/>
										<button
											type="button"
											onclick={() => removeExistingImage(index)}
											class="circle extra error top right absolute"
											style="margin: -0.5rem;"
										>
											<i>close</i>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- File Input -->
					<label class="button border responsive">
						<i>upload</i>
						<span>إضافة صور جديدة</span>
						<input
							type="file"
							accept="image/*"
							multiple
							onchange={handleFileSelect}
							style="display: none;"
						/>
					</label>

					<!-- New Images Preview -->
					{#if newPreviewUrls.length > 0}
						<p class="small-text">صور جديدة:</p>
						<div class="grid">
							{#each newPreviewUrls as url, index (index)}
								<div class="s4 m3 l2">
									<div style="position: relative; aspect-ratio: 1;">
										<img
											src={url}
											alt="صورة جديدة {index + 1}"
											class="round responsive"
											style="width: 100%; height: 100%; object-fit: cover;"
										/>
										<button
											type="button"
											onclick={() => removeNewFile(index)}
											class="circle extra error top right absolute"
											style="margin: -0.5rem;"
										>
											<i>close</i>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</li>
		</ul>

		<!-- Error Message -->
		{#if errorMessage}
			<div class="small-padding">
				<p class="error-text">{errorMessage}</p>
			</div>
		{/if}

		<!-- Submit Button -->
		<button type="submit" disabled={isSubmitting} class="responsive">
			{#if isSubmitting}
				<progress class="circle small"></progress>
				<span>جاري التحديث...</span>
			{:else}
				<i>save</i>
				<span>حفظ التعديلات</span>
			{/if}
		</button>
	</form>
</main>
