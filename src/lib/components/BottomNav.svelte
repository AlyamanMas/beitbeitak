<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let currentPath = $derived(page.url.pathname);
</script>

<nav class="bottom" dir="rtl">
	<a href={resolve('/')} class={{ active: currentPath === resolve('/') }}>
		<i>home</i>
		<div>الرئيسية</div>
	</a>

	<a
		href={resolve('/profile/')}
		class={{
			active: currentPath === resolve('/profile') || currentPath === resolve('/auth/login')
		}}
	>
		<i>person</i>
		<div>الحساب</div>
	</a>
</nav>
