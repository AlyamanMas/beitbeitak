<script>
	// TODO: look at gmail and google calendar for inspiration, basically, override input type="text" element with a new class that has no border at all, have a grid with icons/labels on one side, and the actual input on the other
	// TODO: replace drop-down selects with dialogs
	// TODO: actually see the hero picture here https://m3.material.io/components/text-fields/guidelines
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic, townNamesArabic } from '$lib/towns.js';
	import { getUser, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

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

			const { error: picError } = await supabase.from('listing_to_pic').insert(listingToPicEntries);

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

<header class="fixed">
	<nav>
		<a href={resolve('/')} class="circle transparent">
			<i>arrow_forward</i>
		</a>
		<h6 class="max">إضافة إعلان جديد</h6>
	</nav>
</header>
<main class="responsive">
	<!-- Form -->
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
							{#each Object.keys(townNamesArabic) as townKey}
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

					<!-- File Input -->
					<label class="button border responsive">
						<i>upload</i>
						<span>إضافة صور</span>
						<input
							type="file"
							accept="image/*"
							multiple
							onchange={handleFileSelect}
							style="display: none;"
						/>
					</label>

					<!-- Preview Grid -->
					{#if previewUrls.length > 0}
						<div class="grid">
							{#each previewUrls as url, index}
								<div class="s4 m3 l2">
									<div style="position: relative; aspect-ratio: 1;">
										<img
											src={url}
											alt="معاينة الصورة {index + 1}"
											class="round responsive"
											style="width: 100%; height: 100%; object-fit: cover;"
										/>
										<button
											type="button"
											onclick={() => removeFile(index)}
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
				<span>جاري النشر...</span>
			{:else}
				<i>add</i>
				<span>نشر الإعلان</span>
			{/if}
		</button>
	</form>
</main>
