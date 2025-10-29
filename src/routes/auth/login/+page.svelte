<!-- TODO: add button to return to main page -->
<script>
	import { signIn, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// Redirect if already authenticated
	onMount(() => {
		console.debug('/auth/login: inside page onMount');
		if (isAuthenticated()) {
			console.debug(
				'/auth/login: inside page onMount if(isAuthenticated()) statement call. Going to /'
			);
			goto(resolve('/'));
		}
	});

	/**
	 * Handle login form submission
	 */
	async function handleLogin() {
		if (!email || !password) {
			error = 'يرجى ملء جميع الحقول';
			return;
		}

		loading = true;
		error = '';

		const { error: signInError } = await signIn(email, password);

		if (signInError) {
			error =
				signInError.message === 'Invalid login credentials'
					? 'بيانات الدخول غير صحيحة'
					: 'حدث خطأ أثناء تسجيل الدخول';
			loading = false;
		} else {
			// Redirect to home on success
			goto(resolve('/'));
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 p-4" dir="rtl">
	<div class="w-full max-w-md">
		<!-- Logo/Brand -->
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-4xl font-bold text-primary">بيت بيتك</h1>
			<p class="text-base-content/70">مرحباً بعودتك</p>
		</div>

		<!-- Login Form -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-2xl">تسجيل الدخول</h2>

				{#if error}
					<div class="mb-4 alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleLogin();
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

					<!-- Password -->
					<div class="form-control mt-4 w-full">
						<label class="label" for="password">
							<span class="label-text">كلمة المرور</span>
						</label>
						<input
							id="password"
							type="password"
							placeholder="••••••••"
							class="input-bordered input w-full"
							bind:value={password}
							disabled={loading}
							required
						/>
					</div>

					<!-- Forgot Password Link -->
					<div class="mt-2 text-left">
						<a href={resolve('/auth/forgot-password')} class="link text-sm link-primary">
							نسيت كلمة المرور؟
						</a>
					</div>

					<!-- Submit Button -->
					<div class="form-control mt-6">
						<button type="submit" class="btn w-full btn-primary" disabled={loading}>
							{#if loading}
								<span class="loading loading-spinner"></span>
								جاري تسجيل الدخول...
							{:else}
								تسجيل الدخول
							{/if}
						</button>
					</div>
				</form>

				<!-- Sign Up Link -->
				<div class="divider">أو</div>
				<div class="text-center">
					<p class="text-sm">
						ليس لديك حساب؟
						<a href={resolve('/auth/signup')} class="link font-semibold link-primary">
							إنشاء حساب جديد
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
