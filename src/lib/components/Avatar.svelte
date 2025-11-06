<script>
	import 'beercss/custom-element';
	/**
	 * @typedef {object} Name
	 * @property {string} first_name
	 * @property {string} last_name
	 */

	/**
	 * @typedef {object} AvatarCompProps
	 * @property {string | null} [profilePicUrl] Optional URL for the profile picture.
	 * @property {Name} name The user's name structure.
	 */

	const /** @type {AvatarCompProps} */ { profilePicUrl = null, name } = $props();
</script>

<beer-css>
	<div aria-label="avatar">
		{#if profilePicUrl}
			<div class="center h-30 w-30">
				<img src={profilePicUrl} alt="الصورة الشخصية" class="circle no-elevate responsive" />
			</div>
		{:else}
			<article class="circle extra center primary no-elevate h-30 w-30 overflow-clip">
				<h1 class="middle-align tiny-line h-full">
					{name.first_name.charAt(0) || 'م'}{name.last_name.charAt(0) || 'أ'}
				</h1>
			</article>
		{/if}
	</div>
</beer-css>
