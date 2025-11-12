<script>
	import { resetPassword } from '$lib/stores/authStore.svelte.js';
	import { resolve } from '$app/paths';
	import 'beercss';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	/**
	 * Handle password reset form submission
	 */
	async function handleResetPassword() {
		if (!email) {
			error = 'يرجى إدخال البريد الإلكتروني';
			return;
		}

		loading = true;
		error = '';
		success = false;

		const { error: resetError } = await resetPassword(email);

		loading = false;

		if (resetError) {
			error = 'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور';
		} else {
			success = true;
		}
	}
</script>

<header class="fixed">
	<nav>
		<a href={resolve('/auth/login')} class="circle transparent">
			<i>arrow_forward</i>
		</a>
		<h6 class="max select-none">استعادة كلمة المرور</h6>
	</nav>
</header>

<main class="responsive center-align middle-align">
	<div style="max-width: 28rem; width: 100%;">
		<!-- Logo/Brand -->
		<h3 class="primary-text select-none">بيت بيتك</h3>

		<div class="small-space"></div>

		<!-- Reset Password Form -->
		<article class="padding">
			<h5 class="select-none">نسيت كلمة المرور؟</h5>

			{#if success}
				<div class="green-container small-padding round">
					<i>check_circle</i>
					<div>
						<div class="bold">تم الإرسال!</div>
						<div class="small-text">تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور</div>
					</div>
				</div>

				<a href={resolve('/auth/login')} class="button responsive">
					<i>login</i>
					<span>العودة إلى تسجيل الدخول</span>
				</a>
			{:else}
				<p class="small-text small-opacity select-none">
					أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
				</p>

				{#if error}
					<div class="error-container small-padding round">
						<i>error</i>
						<span>{error}</span>
					</div>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleResetPassword();
					}}
				>
					<!-- Email -->
					<div class="field label border">
						<input
							id="email"
							type="email"
							placeholder=" "
							bind:value={email}
							disabled={loading}
							required
						/>
						<label for="email">البريد الإلكتروني</label>
					</div>

					<!-- Submit Button -->
					<button type="submit" class="responsive" disabled={loading}>
						{#if loading}
							<progress class="circle small"></progress>
							<span>جاري الإرسال...</span>
						{:else}
							<i>send</i>
							<span>إرسال رابط إعادة التعيين</span>
						{/if}
					</button>
				</form>
			{/if}
		</article>
	</div>
</main>
