<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic } from '$lib/towns.js';
	import { getUser, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { resolve } from '$app/paths';
	import 'beercss/custom-element';
	import { goto } from '$app/navigation';
	import ui from 'beercss';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// --- ZOOM STATE ---
	let currentImageIndex = $state(0);
	let overlayVisible = $state(false);

	// We store everything in a single transform object
	let transform = $state({ x: 0, y: 0, scale: 1 });

	// Pointer cache for multi-touch tracking
	let pointers = $state(new Map());
	let startDist = 0;
	let startScale = 1;
	let startCenter = { x: 0, y: 0 };
	let startTransform = { x: 0, y: 0 };

	/**
	 * Check if the current user is the author of this listing
	 * @returns {boolean}
	 */
	let isOwner = $derived(() => {
		if (!isAuthenticated()) return false;
		const user = getUser();
		return user?.id === data.listing.author;
	});

	/**
	 * Get public URL for an image from Supabase storage
	 * @param {string} picName
	 * @returns {string}
	 */
	function getImageUrl(picName) {
		const { data: urlData } = supabase.storage.from('house_pics').getPublicUrl(picName);
		return urlData.publicUrl;
	}

	/**
	 * Format price with currency
	 * @param {number} price
	 * @param {boolean} isUsd
	 * @returns {string}
	 */
	function formatPrice(price, isUsd) {
		const formatted = price.toLocaleString('ar-SY');
		return isUsd ? `${formatted}$` : `${formatted} ل.س`;
	}

	/**
	 * Format date to Arabic locale
	 * @param {string} dateString
	 * @returns {string}
	 */
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('ar-SY', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	/**
	 * Check if URL is a Facebook link
	 * @param {string|null} url
	 * @returns {boolean}
	 */
	function isFacebookUrl(url) {
		if (!url) return false;
		return url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.me');
	}

	/**
	 * Get WhatsApp URL
	 * @param {string} phoneNumber
	 * @returns {string}
	 */
	function getWhatsAppUrl(phoneNumber) {
		// Remove any non-digit characters
		const cleanNumber = phoneNumber.replace(/\D/g, '');
		return `https://wa.me/${cleanNumber}`;
	}

	/**
	 * Get telephone URL
	 * @param {string} phoneNumber
	 * @returns {string}
	 */
	function getTelUrl(phoneNumber) {
		return `tel:${phoneNumber}`;
	}

	let isDeleting = $state(false);

	/**
	 * Delete the current listing
	 */
	async function deleteListing() {
		isDeleting = true;
		try {
			const { error } = await supabase.from('house_listings').delete().eq('id', data.listing.id);

			if (error) {
				console.error('Error deleting listing:', error);
				alert('حدث خطأ أثناء حذف الإعلان');
				isDeleting = false;
				return;
			}

			// Navigate back to home page
			await goto(resolve('/'));
		} catch (err) {
			console.error('Unexpected error:', err);
			alert('حدث خطأ غير متوقع');
			isDeleting = false;
		}
	}

	function openImageOverlay(index) {
		currentImageIndex = index;
		overlayVisible = true;
		resetZoom();
	}

	function closeImageOverlay() {
		overlayVisible = false;
		resetZoom();
	}

	function resetZoom() {
		transform = { x: 0, y: 0, scale: 1 };
		pointers.clear();
	}

	function getDistance(p1, p2) {
		return Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
	}

	function getCenter(p1, p2) {
		return {
			x: (p1.clientX + p2.clientX) / 2,
			y: (p1.clientY + p2.clientY) / 2
		};
	}

	function handlePointerDown(e) {
		// Add pointer to cache
		pointers.set(e.pointerId, e);

		// Setup initial state for interactions
		const points = Array.from(pointers.values());

		if (points.length === 1) {
			// Panning initialization
			startCenter = { x: points[0].clientX, y: points[0].clientY };
			startTransform = { ...transform };
		} else if (points.length === 2) {
			// Pinch initialization
			startDist = getDistance(points[0], points[1]);
			startScale = transform.scale;
			startCenter = getCenter(points[0], points[1]);
			startTransform = { ...transform };
		}
	}

	function handlePointerMove(e) {
		if (!pointers.has(e.pointerId)) return;

		// Update the pointer in the cache
		pointers.set(e.pointerId, e);
		const points = Array.from(pointers.values());

		if (points.length === 1 && transform.scale > 1) {
			// --- PANNING (1 Finger) ---
			// Only allow panning if zoomed in
			e.preventDefault(); // Prevent scrolling page
			const dx = points[0].clientX - startCenter.x;
			const dy = points[0].clientY - startCenter.y;

			transform.x = startTransform.x + dx;
			transform.y = startTransform.y + dy;
		} else if (points.length === 2) {
			// --- PINCH ZOOMING (2 Fingers) ---
			e.preventDefault();

			// 1. Calculate new scale
			const currentDist = getDistance(points[0], points[1]);
			const scaleRatio = currentDist / startDist;
			let newScale = startScale * scaleRatio;

			// Clamp scale (0.5x to 5x)
			newScale = Math.min(Math.max(0.5, newScale), 5);

			// 2. Calculate position adjustment to keep focal point stable
			// This is the magic math that fixes the "drifting"
			const currentCenter = getCenter(points[0], points[1]);

			// How much the center of the pinch moved
			const centerDx = currentCenter.x - startCenter.x;
			const centerDy = currentCenter.y - startCenter.y;

			// Calculate where the image was relative to the pinch center
			const originalPointX = startCenter.x - startTransform.x;
			const originalPointY = startCenter.y - startTransform.y;

			// Apply the new scale factor to that relative distance
			const newPointX = originalPointX * (newScale / startScale);
			const newPointY = originalPointY * (newScale / startScale);

			transform.scale = newScale;
			transform.x = currentCenter.x - newPointX; // Panning delta is implicitly handled here
			transform.y = currentCenter.y - newPointY;
		}
	}

	function handlePointerUp(e) {
		pointers.delete(e.pointerId);

		// If we let go and we are zoomed out less than 1, snap back
		if (pointers.size === 0 && transform.scale < 1) {
			resetZoom();
		}

		// If we go from 2 fingers to 1, reset the start center
		// so the image doesn't "jump" to the old single-finger position
		const points = Array.from(pointers.values());
		if (points.length === 1) {
			startCenter = { x: points[0].clientX, y: points[0].clientY };
			startTransform = { ...transform };
		}
	}

	function handleWheel(e) {
		e.preventDefault();
		const zoomIntensity = 0.1;
		const direction = e.deltaY > 0 ? -1 : 1;
		const factor = 1 + zoomIntensity * direction;

		let newScale = transform.scale * factor;
		newScale = Math.min(Math.max(1, newScale), 5); // Clamp

		// Zoom towards mouse cursor
		// relative cursor pos
		const rect = e.currentTarget.getBoundingClientRect();
		const mouseX = e.clientX - rect.left; // relative to container
		const mouseY = e.clientY - rect.top;

		// Calculate the point on the image under the cursor
		// (mouseX - currentX) / currentScale
		const pointX = (mouseX - transform.x) / transform.scale;
		const pointY = (mouseY - transform.y) / transform.scale;

		// New position = mouse - (point * newScale)
		transform.x = mouseX - pointX * newScale;
		transform.y = mouseY - pointY * newScale;
		transform.scale = newScale;
	}

	/**
	 * Navigate to previous image
	 */
	function previousImage() {
		if (currentImageIndex > 0) {
			currentImageIndex--;
			resetZoom();
		}
	}

	/**
	 * Navigate to next image
	 */
	function nextImage() {
		if (currentImageIndex < data.listing.listing_to_pic.length - 1) {
			currentImageIndex++;
			resetZoom();
		}
	}

	/**
	 * Download current image
	 */
	async function downloadImage() {
		const picName = data.listing.listing_to_pic[currentImageIndex].pic_name;

		const imageUrl = getImageUrl(picName);

		try {
			const response = await fetch(imageUrl);

			const blob = await response.blob();

			const url = window.URL.createObjectURL(blob);

			const a = document.createElement('a');

			a.href = url;

			a.download = picName || 'image.jpg';

			document.body.appendChild(a);

			a.click();

			window.URL.revokeObjectURL(url);

			document.body.removeChild(a);
		} catch (err) {
			console.error('Error downloading image:', err);

			alert('حدث خطأ أثناء تحميل الصورة');
		}
	}
</script>

<header class="fixed">
	<nav>
		<button onclick={() => goto(resolve('/'))} class="transparent">
			<i>arrow_forward</i>
			<span>العودة إلى القائمة</span>
		</button>
	</nav>
</header>

<main class="responsive">
	{#if data.listing.listing_to_pic && data.listing.listing_to_pic.length > 0}
		<div class="relative" role="region" aria-label="معرض الصور">
			<div class="small-round cursor-pointer" onclick={() => openImageOverlay(currentImageIndex)}>
				<img
					src={getImageUrl(data.listing.listing_to_pic[currentImageIndex].pic_name)}
					alt="صورة العقار"
					class="center h-60 object-cover"
				/>
			</div>

			{#if data.listing.listing_to_pic.length > 1}
				<p
					class="small-blur chip absolute bottom-4 left-1/2 -translate-x-1/2"
					role="status"
					aria-live="polite"
				>
					{currentImageIndex + 1} / {data.listing.listing_to_pic.length}
				</p>
			{/if}
		</div>

		{#if data.listing.listing_to_pic.length > 1}
			<div class="row scroll left-padding right-padding" role="region" aria-label="الصور المصغرة">
				{#each data.listing.listing_to_pic as pic, index (pic)}
					<article onclick={() => (currentImageIndex = index)} class="no-padding cursor-pointer">
						<img
							src={getImageUrl(pic.pic_name)}
							alt="صورة مصغرة {index + 1}"
							class="h-20 w-20 object-cover"
						/>
					</article>
				{/each}
			</div>
		{/if}
	{/if}

	<div class="padding">
		<section id="price-section" class="select-none">
			<div class="text-2xl">
				{formatPrice(data.listing.rent_per_month, data.listing.rent_in_usd)}<span
					class="text-base opacity-70">/شهرياً</span
				>
			</div>
		</section>

		<div class="small-space"></div>

		<section id="property-details">
			<h4 class="select-none">تفاصيل العقار</h4>
			<div class="flex flex-wrap gap-4">
				<div class="flex items-center gap-2">
					<i>square_foot</i>
					<div>
						<div class="text-xs opacity-60 select-none">المساحة</div>
						<div class="font-semibold">{data.listing.size_m2} م²</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<i>bed</i>
					<div>
						<div class="text-xs opacity-60 select-none">غرف النوم</div>
						<div class="font-semibold">{data.listing.num_bedrooms}</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<i>bathroom</i>
					<div>
						<div class="text-xs opacity-60 select-none">الحمامات</div>
						<div class="font-semibold">{data.listing.num_bathrooms}</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<i>home</i>
					<div>
						<div class="text-xs opacity-60 select-none">المنطقة</div>
						<div class="font-semibold">{getTownNameArabic(data.listing.town)}</div>
					</div>
				</div>
			</div>
		</section>

		{#if data.listing.description}
			<section id="description-section">
				<h4 class="mb-3 text-lg font-semibold select-none">الوصف</h4>
				<p>{data.listing.description}</p>
			</section>
		{/if}

		<section id="address-section">
			<h4 class="flex select-none">العنوان</h4>
			<p class="text-base">{data.listing.address}</p>
		</section>

		{#if data.listing.phone_number || data.listing.source_url}
			<section id="contact-section">
				<h4 class="select-none">معلومات التواصل</h4>
				<div class="flex flex-col gap-2">
					{#if data.listing.phone_number}
						{#if data.listing.whatsapp_comm}
							<button
								onclick={() =>
									window.open(getWhatsAppUrl(data.listing.phone_number), '_blank')?.focus()}
								class="responsive green5"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
									/>
								</svg>
								<span>تواصل عبر واتساب</span>
							</button>
						{:else}
							<button
								onclick={() => window.open(getTelUrl(data.listing.phone_number), '_blank')?.focus()}
								class="responsive"
							>
								<i>phone</i>
								<!-- TODO: fix alignment/formatting of phone number -->
								<span>اتصل: {data.listing.phone_number}</span>
							</button>
						{/if}
					{/if}

					{#if data.listing.source_url}
						<button
							onclick={() => window.open(data.listing.source_url, '_blank')?.focus()}
							class={'responsive' + isFacebookUrl(data.listing.source_url) ? 'blue9' : ''}
						>
							{#if isFacebookUrl(data.listing.source_url)}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
									/>
								</svg>
								<span>عرض على فيسبوك</span>
							{:else}
								<i>open_in_new</i>
								<span>رابط المصدر</span>
							{/if}
						</button>
					{/if}
				</div>
			</section>
		{/if}

		<section id="metadata-section">
			<div class="space-y-2">
				{#if data.listing.users}
					<div class="flex items-center gap-2 text-sm opacity-70">
						<i class="text-base">person</i>
						<span
							>منشور بواسطة: {data.listing.users.first_name}
							{data.listing.users.last_name}</span
						>
					</div>
				{/if}

				<div class="flex items-center gap-2 text-sm opacity-70">
					<i class="text-base">calendar_today</i>
					<span>تاريخ النشر: {formatDate(data.listing.created_at)}</span>
				</div>
			</div>
		</section>

		{#if isOwner()}
			<section id="owner-actions">
				<button
					onclick={() => goto(resolve(`/listings/${data.listing.id}/edit`))}
					class="responsive"
				>
					<i>edit</i>
					<span>تعديل الإعلان</span>
				</button>

				<div class="small-space"></div>

				<button data-ui="#delete-dialog" class="responsive red" disabled={isDeleting}>
					<i>delete</i>
					<span>{isDeleting ? 'جاري الحذف...' : 'حذف الإعلان'}</span>
				</button>
			</section>
		{/if}
	</div>
</main>

<!-- Delete confirmation dialog -->
<dialog id="delete-dialog" class="modal">
	<h5>تأكيد الحذف</h5>
	<p>هل أنت متأكد من رغبتك في حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.</p>
	<nav class="right-align">
		<button data-ui="#delete-dialog" class="border">إلغاء</button>
		<button
			onclick={async () => {
				// Close dialog first
				ui('#delete-dialog');
				await deleteListing();
			}}
			class="red"
			disabled={isDeleting}
		>
			حذف
		</button>
	</nav>
</dialog>

<!-- Image overlay viewer -->
{#if overlayVisible && data.listing.listing_to_pic && data.listing.listing_to_pic.length > 0}
	<div
		class="overlay active center-align middle-align"
		style="background: rgba(0, 0, 0, 0.95); z-index: 9999; touch-action: none;"
		onclick={closeImageOverlay}
		role="dialog"
		aria-label="عارض الصور"
	>
		<div
			class="top left right absolute"
			style="z-index: 10000; background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent); padding: 1rem;"
			onclick={(e) => e.stopPropagation()}
		>
			<nav class="transparent">
				<button onclick={closeImageOverlay} class="transparent circle" aria-label="إغلاق">
					<i class="white-text">close</i>
				</button>

				<div class="max"></div>

				{#if data.listing.listing_to_pic.length > 1}
					<span class="chip small-blur">
						{currentImageIndex + 1} / {data.listing.listing_to_pic.length}
					</span>
				{/if}

				<button onclick={downloadImage} class="transparent circle" aria-label="تحميل الصورة">
					<i class="white-text">download</i>
				</button>
			</nav>
		</div>

		<div
			class="center-align middle-align h-full w-full"
			onclick={(e) => e.stopPropagation()}
			style="overflow: hidden; touch-action: none; position: relative;"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			onpointerleave={handlePointerUp}
			onwheel={handleWheel}
		>
			<img
				src={getImageUrl(data.listing.listing_to_pic[currentImageIndex].pic_name)}
				alt="صورة العقار {currentImageIndex + 1}"
				style="
                    max-width: 100%;
                    max-height: 100vh;
                    object-fit: contain;
                    /* The Key Change: Origin top-left makes the math linear */
                    transform-origin: 0 0; 
                    transform: translate({transform.x}px, {transform.y}px) scale({transform.scale});
                    transition: {pointers.size === 0
					? 'transform 0.2s cubic-bezier(0.1, 0.7, 0.1, 1)'
					: 'none'};
                    user-select: none;
                    -webkit-user-select: none;
                    pointer-events: none; /* Let events bubble to parent div */
                "
				draggable="false"
			/>
		</div>
	</div>
{/if}
