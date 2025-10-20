<script>
	import { signUp, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let error = $state('');
	let loading = $state(false);

	// Redirect if already authenticated
	onMount(() => {
		if (isAuthenticated()) {
			goto(resolve('/'));
		}
	});

	/**
	 * Handle signup form submission
	 */
	async function handleSignup() {
		// Validation
		if (!email || !password || !confirmPassword || !firstName || !lastName) {
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

		const { error: signUpError } = await signUp(email, password, firstName, lastName);

		if (signUpError) {
			error = signUpError.message.includes('already registered')
				? 'هذا البريد الإلكتروني مسجل بالفعل'
				: 'حدث خطأ أثناء إنشاء الحساب';
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
			<p class="text-base-content/70">انضم إلينا اليوم</p>
		</div>

		<!-- Signup Form -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-2xl">إنشاء حساب جديد</h2>

				{#if error}
					<div class="mb-4 alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSignup();
					}}
				>
					<!-- First Name -->
					<div class="form-control w-full">
						<label class="label" for="firstName">
							<span class="label-text">الاسم الأول</span>
						</label>
						<input
							id="firstName"
							type="text"
							placeholder="محمد"
							class="input-bordered input w-full"
							bind:value={firstName}
							disabled={loading}
							required
						/>
					</div>

					<!-- Last Name -->
					<div class="form-control mt-4 w-full">
						<label class="label" for="lastName">
							<span class="label-text">الاسم الأخير</span>
						</label>
						<input
							id="lastName"
							type="text"
							placeholder="أحمد"
							class="input-bordered input w-full"
							bind:value={lastName}
							disabled={loading}
							required
						/>
					</div>

					<!-- Email -->
					<div class="form-control mt-4 w-full">
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

					<!-- Confirm Password -->
					<div class="form-control mt-4 w-full">
						<label class="label" for="confirmPassword">
							<span class="label-text">تأكيد كلمة المرور</span>
						</label>
						<input
							id="confirmPassword"
							type="password"
							placeholder="••••••••"
							class="input-bordered input w-full"
							bind:value={confirmPassword}
							disabled={loading}
							required
						/>
					</div>

					<!-- Submit Button -->
					<div class="form-control mt-6">
						<button type="submit" class="btn w-full btn-primary" disabled={loading}>
							{#if loading}
								<span class="loading loading-spinner"></span>
								جاري إنشاء الحساب...
							{:else}
								إنشاء حساب
							{/if}
						</button>
					</div>
				</form>

				<!-- Login Link -->
				<div class="divider">أو</div>
				<div class="text-center">
					<p class="text-sm">
						لديك حساب بالفعل؟
						<a href={resolve('/auth/login')} class="link font-semibold link-primary">
							تسجيل الدخول
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
