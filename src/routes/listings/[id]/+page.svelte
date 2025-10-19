<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic } from '$lib/towns.js';
	import { getUser, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { resolve } from '$app/paths';
	import {
		Home,
		Bed,
		Bath,
		Maximize,
		MapPin,
		Phone,
		Calendar,
		User,
		ExternalLink,
		ChevronRight,
		ArrowRight,
		Edit
	} from 'lucide-svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	let currentImageIndex = $state(0);

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
		return isUsd ? `$${formatted}` : `${formatted} ل.س`;
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

	/**
	 * Navigate to next image
	 */
	function nextImage() {
		if (data.listing.listing_to_pic && data.listing.listing_to_pic.length > 0) {
			currentImageIndex = (currentImageIndex + 1) % data.listing.listing_to_pic.length;
		}
	}

	/**
	 * Navigate to previous image
	 */
	function previousImage() {
		if (data.listing.listing_to_pic && data.listing.listing_to_pic.length > 0) {
			currentImageIndex =
				(currentImageIndex - 1 + data.listing.listing_to_pic.length) %
				data.listing.listing_to_pic.length;
		}
	}
</script>

<div class="min-h-screen bg-base-200 pb-24" dir="rtl">
	<!-- Back Button -->
	<div class="sticky top-0 z-10 bg-base-100 p-4 shadow-sm">
		<a href={resolve('/')} class="btn gap-2 btn-ghost btn-sm">
			<ArrowRight size={20} />
			العودة إلى القائمة
		</a>
	</div>

	<!-- Image Carousel -->
	{#if data.listing.listing_to_pic && data.listing.listing_to_pic.length > 0}
		<div class="relative bg-black">
			<div class="aspect-video w-full">
				<!-- TODO: add page for image viewing when clicking on it -->
				<img
					src={getImageUrl(data.listing.listing_to_pic[currentImageIndex].pic_name)}
					alt="صورة العقار"
					class="h-full w-full object-cover"
				/>
			</div>

			<!-- Navigation Buttons -->
			{#if data.listing.listing_to_pic.length > 1}
				<button
					onclick={previousImage}
					class="btn absolute top-1/2 right-2 btn-circle -translate-y-1/2 border-none bg-black/50 text-white btn-sm hover:bg-black/70"
					aria-label="الصورة السابقة"
				>
					<ChevronRight size={20} />
				</button>
				<button
					onclick={nextImage}
					class="btn absolute top-1/2 left-2 btn-circle -translate-y-1/2 border-none bg-black/50 text-white btn-sm hover:bg-black/70"
					aria-label="الصورة التالية"
				>
					<ChevronRight size={20} class="rotate-180" />
				</button>

				<!-- Image Counter -->
				<div
					class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
				>
					{currentImageIndex + 1} / {data.listing.listing_to_pic.length}
				</div>
			{/if}
		</div>

		<!-- Thumbnail Strip -->
		{#if data.listing.listing_to_pic.length > 1}
			<div class="overflow-x-auto bg-base-100 p-2">
				<div class="flex gap-2">
					{#each data.listing.listing_to_pic as pic, index (pic)}
						<button
							onclick={() => (currentImageIndex = index)}
							class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 {currentImageIndex ===
							index
								? 'border-primary'
								: 'border-transparent'}"
						>
							<img
								src={getImageUrl(pic.pic_name)}
								alt="صورة مصغرة {index + 1}"
								class="h-full w-full object-cover"
							/>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Listing Details -->
	<div class="space-y-4 p-4">
		<!-- Price Card -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body p-4">
				<div class="text-3xl font-bold text-primary">
					{formatPrice(data.listing.rent_per_month, data.listing.rent_in_usd)}
					<span class="text-base font-normal text-base-content/70">/شهرياً</span>
				</div>
			</div>
		</div>

		<!-- Property Details Card -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body space-y-3 p-4">
				<h2 class="card-title text-lg">تفاصيل العقار</h2>

				<div class="grid grid-cols-2 gap-3">
					<!-- Size -->
					<div class="flex items-center gap-2 text-base-content/80">
						<Maximize size={20} />
						<div>
							<div class="text-xs text-base-content/60">المساحة</div>
							<div class="font-semibold">{data.listing.size_m2} م²</div>
						</div>
					</div>

					<!-- Bedrooms -->
					<div class="flex items-center gap-2 text-base-content/80">
						<Bed size={20} />
						<div>
							<div class="text-xs text-base-content/60">غرف النوم</div>
							<div class="font-semibold">{data.listing.num_bedrooms}</div>
						</div>
					</div>

					<!-- Bathrooms -->
					<div class="flex items-center gap-2 text-base-content/80">
						<Bath size={20} />
						<div>
							<div class="text-xs text-base-content/60">الحمامات</div>
							<div class="font-semibold">{data.listing.num_bathrooms}</div>
						</div>
					</div>

					<!-- Town -->
					<div class="flex items-center gap-2 text-base-content/80">
						<Home size={20} />
						<div>
							<div class="text-xs text-base-content/60">المنطقة</div>
							<div class="font-semibold">{getTownNameArabic(data.listing.town)}</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Address Card -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body p-4">
				<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/60">
					<MapPin size={16} />
					العنوان
				</h3>
				<p class="text-base">{data.listing.address}</p>
			</div>
		</div>

		<!-- Contact Information Card -->
		{#if data.listing.phone_number || data.listing.source_url}
			<div class="card bg-base-100 shadow-md">
				<div class="card-body space-y-3 p-4">
					<h3 class="text-lg font-semibold">معلومات التواصل</h3>

					<!-- Phone Number -->
					{#if data.listing.phone_number}
						<div>
							{#if data.listing.whatsapp_comm}
								<!-- WhatsApp -->
								<a
									href={getWhatsAppUrl(data.listing.phone_number)}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-block gap-2 btn-success"
								>
									<!-- WhatsApp Icon (using Phone as placeholder since lucide-svelte might not have WhatsApp) -->
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
									تواصل عبر واتساب
								</a>
							{:else}
								<!-- Regular Phone -->
								<a
									href={getTelUrl(data.listing.phone_number)}
									class="btn btn-block gap-2 btn-primary"
								>
									<Phone size={20} />
									اتصل: {data.listing.phone_number}
								</a>
							{/if}
						</div>
					{/if}

					<!-- Source URL -->
					{#if data.listing.source_url}
						<div>
							<a
								href={data.listing.source_url}
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-block gap-2 btn-outline"
							>
								{#if isFacebookUrl(data.listing.source_url)}
									<!-- Facebook Icon -->
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
									عرض على فيسبوك
								{:else}
									<ExternalLink size={20} />
									رابط المصدر
								{/if}
							</a>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Additional Information Card -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body space-y-2 p-4">
				<!-- Author -->
				{#if data.listing.users}
					<div class="flex items-center gap-2 text-sm text-base-content/70">
						<User size={16} />
						<span
							>منشور بواسطة: {data.listing.users.first_name}
							{data.listing.users.last_name}</span
						>
					</div>
				{/if}

				<!-- Created Date -->
				<div class="flex items-center gap-2 text-sm text-base-content/70">
					<Calendar size={16} />
					<span>تاريخ النشر: {formatDate(data.listing.created_at)}</span>
				</div>
			</div>
		</div>

		<!-- Edit Button (only for listing owner) -->
		{#if isOwner()}
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-4">
					<a href={resolve(`/listings/${data.listing.id}/edit`)} class="btn btn-outline w-full gap-2">
						<Edit size={20} />
						تعديل الإعلان
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
