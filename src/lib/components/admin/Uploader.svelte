<script lang="ts">
	import { uploadImage, ACCEPTED } from '$lib/upload';
	import Icon from '../Icon.svelte';

	let {
		folder,
		propertyId,
		altBase = '',
		multiple = true,
		max = 40,
		onuploaded
	}: {
		folder: 'propiedades' | 'blog' | 'equipo' | 'site';
		propertyId?: string;
		altBase?: string;
		multiple?: boolean;
		max?: number;
		onuploaded?: (m: { id: string; width: number; height: number; alt: string }) => void;
	} = $props();

	type Job = { name: string; status: string; error?: string; done?: boolean; file: File };
	let jobs = $state<Job[]>([]);
	let over = $state(false);
	let input: HTMLInputElement;
	let counter = 0;

	async function run(job: Job) {
		job.error = undefined;
		job.done = false;
		try {
			counter++;
			const alt = altBase ? `${altBase} — fotografía ${counter}` : job.file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
			const m = await uploadImage(job.file, { alt, folder, propertyId }, (s) => (job.status = s));
			job.status = 'Listo';
			job.done = true;
			onuploaded?.(m);
		} catch (e) {
			job.error = (e as Error).message;
			job.status = 'Error';
		}
	}

	async function add(files: FileList | File[]) {
		const list = Array.from(files).slice(0, max);
		const added = list.map((file) => ({ name: file.name, status: 'En cola', file }) as Job);
		jobs = [...jobs, ...added];
		// 3 en paralelo
		const queue = jobs.slice(jobs.length - added.length);
		let i = 0;
		await Promise.all(
			Array.from({ length: 3 }, async () => {
				while (i < queue.length) await run(queue[i++]);
			})
		);
	}
</script>

<div
	class="drop"
	class:over
	role="button"
	tabindex="0"
	aria-label="Subir imágenes: arrastra archivos o presiona Enter para elegir"
	ondragover={(e) => {
		e.preventDefault();
		over = true;
	}}
	ondragleave={() => (over = false)}
	ondrop={(e) => {
		e.preventDefault();
		over = false;
		if (e.dataTransfer?.files) add(e.dataTransfer.files);
	}}
	onclick={() => input.click()}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && input.click()}
>
	<Icon name="upload" size={28} />
	<p><strong>Arrastra fotos aquí</strong> o haz clic para elegir{multiple ? ` (máx. ${max} por lote)` : ''}</p>
	<p class="small muted">JPG, PNG, WebP o AVIF hasta 20 MB. Se optimizan y se eliminan metadatos (GPS) antes de subir.</p>
	<input
		bind:this={input}
		type="file"
		accept={ACCEPTED.join(',')}
		{multiple}
		hidden
		onchange={(e) => {
			const f = (e.currentTarget as HTMLInputElement).files;
			if (f) add(f);
			(e.currentTarget as HTMLInputElement).value = '';
		}}
	/>
</div>
{#if jobs.length}
	<ul class="jobs">
		{#each jobs as j, i (i)}
			<li class:err={!!j.error} class:ok={j.done}>
				<span class="n">{j.name}</span>
				<span class="s">{j.error ?? j.status}</span>
				{#if j.error}<button class="btn btn--plain btn--sm" type="button" onclick={() => run(j)}>Reintentar</button>{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.drop {
		display: grid;
		justify-items: center;
		gap: 4px;
		padding: var(--sp-6) var(--sp-4);
		border: 2px dashed var(--line-strong);
		border-radius: 10px;
		text-align: center;
		cursor: pointer;
		color: var(--brand-primary);
		background: #fbfcfd;
		transition: all 0.15s;
	}
	.drop.over,
	.drop:hover {
		border-color: var(--brand-primary-600);
		background: var(--brand-primary-050);
	}
	.drop p {
		margin: 0;
		color: var(--ink);
	}
	.jobs {
		list-style: none;
		padding: 0;
		margin: var(--sp-3) 0 0;
		display: grid;
		gap: 4px;
		font-size: 0.85rem;
	}
	.jobs li {
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 6px 10px;
		border-radius: 6px;
		background: #f4f6f9;
	}
	.jobs li.ok {
		background: var(--success-bg);
	}
	.jobs li.err {
		background: var(--danger-bg);
		color: var(--danger);
	}
	.n {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
