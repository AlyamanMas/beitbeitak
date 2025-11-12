<script>
	import { signIn, onAuthReady } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import 'beercss';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// Redirect if already authenticated
	onMount(() => {
		console.debug('/auth/login: inside page onMount');
		onAuthReady((authenticated) => {
			if (authenticated) {
				goto(resolve('/'));
			}
		});
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

<header class="fixed">
	<nav>
		<a href={resolve('/')} class="circle transparent">
			<i>arrow_forward</i>
		</a>
		<h6 class="max select-none">تسجيل الدخول</h6>
	</nav>
</header>

<main class="responsive center-align middle-align">
	<div style="max-width: 28rem; width: 100%;">
		<!-- Logo/Brand -->
		<h3 class="primary-text select-none">البيت بيتك</h3>

		<div class="small-space"></div>

		<!-- Login Form -->
		<article class="padding">
			<h5 class="select-none">تسجيل الدخول</h5>

			{#if error}
				<div class="error-container small-padding round">
					<i>error</i>
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
					<span class="helper">
						<a href={resolve('/auth/forgot-password')} class="link small-text">
							نسيت كلمة المرور؟
						</a>
					</span>
				</div>

				<!-- Forgot Password Link -->

				<!-- Submit Button -->
				<button type="submit" class="responsive" disabled={loading}>
					{#if loading}
						<progress class="circle small"></progress>
						<span>جاري تسجيل الدخول...</span>
					{:else}
						<i>login</i>
						<span>تسجيل الدخول</span>
					{/if}
				</button>
			</form>

			<!-- Sign Up Link -->
			<div class="small-space"></div>
			<hr />
			<div class="small-space"></div>
			<div class="center-align">
				<p class="small-text select-none">
					ليس لديك حساب؟
					<a href={resolve('/auth/signup')} class="link bold">إنشاء حساب جديد</a>
				</p>
			</div>
		</article>
	</div>
</main>
