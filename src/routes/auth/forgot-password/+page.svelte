<script>
	import { resetPassword } from '$lib/stores/authStore.svelte.js';
	import { resolve } from '$app/paths';
	import { ArrowRight } from 'lucide-svelte';

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

<div class="bg-base-200 flex min-h-screen items-center justify-center p-4" dir="rtl">
	<div class="w-full max-w-md">
		<!-- Logo/Brand -->
		<div class="mb-8 text-center">
			<h1 class="text-primary mb-2 text-4xl font-bold">بيت بيتك</h1>
			<p class="text-base-content/70">استعادة كلمة المرور</p>
		</div>

		<!-- Reset Password Form -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<!-- Back Button -->
				<a href={resolve('/auth/login')} class="btn btn-ghost btn-sm mb-2 self-start">
					<ArrowRight size={20} />
					العودة إلى تسجيل الدخول
				</a>

				<h2 class="card-title mb-4 text-2xl">نسيت كلمة المرور؟</h2>

				{#if success}
					<div class="alert alert-success mb-4">
						<div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 flex-shrink-0 stroke-current"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div>
								<p class="font-bold">تم الإرسال!</p>
								<p class="text-sm">تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
							</div>
						</div>
					</div>
				{:else}
					<p class="text-base-content/70 mb-4 text-sm">
						أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
					</p>

					{#if error}
						<div class="alert alert-error mb-4">
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
						<div class="form-control w-full">
							<label class="label" for="email">
								<span class="label-text">البريد الإلكتروني</span>
							</label>
							<input
								id="email"
								type="email"
								placeholder="example@email.com"
								class="input-bordered input w-full"
								bind:value={email}
								disabled={loading}
								required
							/>
						</div>

						<!-- Submit Button -->
						<div class="form-control mt-6">
							<button type="submit" class="btn btn-primary w-full" disabled={loading}>
								{#if loading}
									<span class="loading loading-spinner"></span>
									جاري الإرسال...
								{:else}
									إرسال رابط إعادة التعيين
								{/if}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>
