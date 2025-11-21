<script>
	import { updatePassword } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import 'beercss';

	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	/**
	 * Handle password update form submission
	 */
	async function handleUpdatePassword() {
		// Validation
		if (!password || !confirmPassword) {
			error = 'يرجى ملء جميع الحقول';
			return;
		}

		if (password !== confirmPassword) {
			error = 'كلمات المرور غير متطابقة';
			return;
		}

		if (password.length < 6) {
			error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
			return;
		}

		loading = true;
		error = '';
		success = false;

		const { error: updateError } = await updatePassword(password);

		loading = false;

		if (updateError) {
			error = 'حدث خطأ أثناء تحديث كلمة المرور';
		} else {
			success = true;
			// Redirect to login after 2 seconds
			setTimeout(() => {
				goto(resolve('/auth/login'));
			}, 2000);
		}
	}
</script>

<header class="fixed">
	<nav>
		<a href={resolve('/auth/login')} class="circle transparent">
			<i>arrow_forward</i>
		</a>
		<h6 class="max select-none">إعادة تعيين كلمة المرور</h6>
	</nav>
</header>

<main class="responsive center-align middle-align">
	<div style="max-width: 28rem; width: 100%;">
		<!-- Logo/Brand -->
		<h3 class="primary-text select-none">بيت بيتك</h3>

		<div class="small-space"></div>

		<!-- Reset Password Form -->
		<article class="padding">
			<h5 class="select-none">تعيين كلمة مرور جديدة</h5>

			{#if success}
				<div class="green-container small-padding round">
					<i>check_circle</i>
					<div>
						<div class="bold">تم التحديث بنجاح!</div>
						<div class="small-text">سيتم توجيهك إلى صفحة تسجيل الدخول</div>
					</div>
				</div>
			{:else}
				<p class="small-text small-opacity select-none">أدخل كلمة المرور الجديدة الخاصة بك</p>

				{#if error}
					<div class="error-container small-padding round">
						<i>error</i>
						<span>{error}</span>
					</div>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleUpdatePassword();
					}}
				>
					<!-- New Password -->
					<div class="field label border">
						<input
							id="password"
							type="password"
							placeholder=" "
							bind:value={password}
							disabled={loading}
							required
						/>
						<label for="password">كلمة المرور الجديدة</label>
					</div>

					<!-- Confirm Password -->
					<div class="field label border">
						<input
							id="confirmPassword"
							type="password"
							placeholder=" "
							bind:value={confirmPassword}
							disabled={loading}
							required
						/>
						<label for="confirmPassword">تأكيد كلمة المرور</label>
					</div>

					<!-- Submit Button -->
					<button type="submit" class="responsive" disabled={loading}>
						{#if loading}
							<progress class="circle small"></progress>
							<span>جاري التحديث...</span>
						{:else}
							<i>lock_reset</i>
							<span>تحديث كلمة المرور</span>
						{/if}
					</button>
				</form>
			{/if}
		</article>
	</div>
</main>
