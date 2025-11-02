<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { getTownNameArabic } from '$lib/towns.js';
	import { getUser, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { resolve } from '$app/paths';
	import 'beercss/custom-element';
	import { goto } from '$app/navigation';

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
</script>

<beer-css>
	<div dir="rtl">
		<header>
			<nav>
				<button onclick={() => goto(resolve('/'))} class="transparent">
					<i>arrow_forward</i>
					<span>العودة إلى القائمة</span>
				</button>
			</nav>
		</header>

		{#if data.listing.listing_to_pic && data.listing.listing_to_pic.length > 0}
			<div class="relative" role="region" aria-label="معرض الصور">
				<div class="aspect-video w-full">
					<img
						src={getImageUrl(data.listing.listing_to_pic[currentImageIndex].pic_name)}
						alt="صورة العقار"
						class="h-full w-full object-cover"
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
						<article onclick={() => (currentImageIndex = index)} class="no-padding">
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
			<section id="price-section">
				<div class="text-2xl">
					{formatPrice(data.listing.rent_per_month, data.listing.rent_in_usd)}<span
						class="text-base opacity-70">/شهرياً</span
					>
				</div>
			</section>

			<div class="small-space"></div>

			<section id="property-details">
				<h4>تفاصيل العقار</h4>
				<div class="flex flex-wrap gap-4">
					<div class="flex items-center gap-2">
						<i>square_foot</i>
						<div>
							<div class="text-xs opacity-60">المساحة</div>
							<div class="font-semibold">{data.listing.size_m2} م²</div>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<i>bed</i>
						<div>
							<div class="text-xs opacity-60">غرف النوم</div>
							<div class="font-semibold">{data.listing.num_bedrooms}</div>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<i>bathroom</i>
						<div>
							<div class="text-xs opacity-60">الحمامات</div>
							<div class="font-semibold">{data.listing.num_bathrooms}</div>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<i>home</i>
						<div>
							<div class="text-xs opacity-60">المنطقة</div>
							<div class="font-semibold">{getTownNameArabic(data.listing.town)}</div>
						</div>
					</div>
				</div>
			</section>

			{#if data.listing.description}
				<section id="description-section">
					<h4 class="mb-3 text-lg font-semibold">الوصف</h4>
					<p>{data.listing.description}</p>
				</section>
			{/if}

			<section id="address-section">
				<h4 class="flex">
					<i class="text-base">location_on</i> العنوان
				</h4>
				<p class="text-base">{data.listing.address}</p>
			</section>

			{#if data.listing.phone_number || data.listing.source_url}
				<section id="contact-section">
					<h4>معلومات التواصل</h4>
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
									onclick={() =>
										window.open(getTelUrl(data.listing.phone_number), '_blank')?.focus()}
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
				<section id="edit-section">
					<button
						onclick={() => goto(resolve(`/listings/${data.listing.id}/edit`))}
						class="responsive red"
					>
						<i>edit</i>
						<span>تعديل الإعلان</span>
					</button>
				</section>
			{/if}
		</div>
	</div>
</beer-css>
