<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/stores/authStore.svelte.js';
	import 'beercss/custom-element';

	const pathForProfile = isAuthenticated() ? '/profile' : '/auth/login';

	let currentPath = $derived(page.url.pathname);
</script>

<beer-css>
	<nav class="bottom" dir="rtl">
		<a href={resolve('/')} class={{ active: currentPath === '/' }}>
			<i>home</i>
			<div>الرئيسية</div>
		</a>

		<a
			href={resolve(pathForProfile)}
			class={{ active: currentPath === '/profile' || currentPath === '/auth/login' }}
		>
			<i>person</i>
			<div>الحساب</div>
		</a>
	</nav>
</beer-css>
