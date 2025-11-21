<script>
	import { signUp, isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import 'beercss';

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

<header class="fixed">
	<nav>
		<a href={resolve('/')} class="circle transparent">
			<i>arrow_forward</i>
		</a>
		<h6 class="max select-none">إنشاء حساب</h6>
	</nav>
</header>

<main class="responsive center-align middle-align">
	<div style="max-width: 28rem; width: 100%;">
		<!-- Logo/Brand -->
		<h3 class="primary-text select-none">بيت بيتك</h3>

		<!-- Signup Form -->
		<article class="padding">
			<h5 class="select-none">إنشاء حساب جديد</h5>

			{#if error}
				<div class="error-container small-padding round">
					<i>error</i>
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
				<div class="field label border">
					<input
						id="firstName"
						type="text"
						placeholder=" "
						bind:value={firstName}
						disabled={loading}
						required
					/>
					<label for="firstName">الاسم الأول</label>
				</div>

				<!-- Last Name -->
				<div class="field label border">
					<input
						id="lastName"
						type="text"
						placeholder=" "
						bind:value={lastName}
						disabled={loading}
						required
					/>
					<label for="lastName">الاسم الأخير</label>
				</div>

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

				<!-- Password -->
				<div class="field label border">
					<input
						id="password"
						type="password"
						placeholder=" "
						bind:value={password}
						disabled={loading}
						required
					/>
					<label for="password">كلمة المرور</label>
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
						<span>جاري إنشاء الحساب...</span>
					{:else}
						<i>person_add</i>
						<span>إنشاء حساب</span>
					{/if}
				</button>
			</form>

			<!-- Login Link -->
			<div class="small-space"></div>
			<hr />
			<div class="small-space"></div>
			<div class="center-align">
				<p class="small-text select-none">
					لديك حساب بالفعل؟
					<a href={resolve('/auth/login')} class="link bold">تسجيل الدخول</a>
				</p>
			</div>
		</article>
	</div>
</main>
