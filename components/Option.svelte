<script lang="ts">
  import { slide } from 'svelte/transition';

  import * as storage from '@/lib/storage';
  import Toggle from '@/components/Toggle.svelte';
  const msg = chrome.i18n.getMessage;

  let { slackTeamId }: { slackTeamId: string } = $props();

  let option: Required<storage.Option> | undefined = $state(undefined);
  let touchedOption = $state(false);

  // オプションの読み込み
  $effect(() => {
    const teamId = slackTeamId;
    (async () => {
      const workSpaceOptions = await storage.get('workSpaceOptions');
      option = { ...storage.defaultOption, ...workSpaceOptions?.[teamId] };
    })();
  });

  // オプションの書き込み（ユーザー操作後のみ）
  $effect(() => {
    if (!option || !touchedOption) return;
    const currentOption = { ...option };
    const teamId = slackTeamId;
    (async () => {
      const workSpaceOptions = (await storage.get('workSpaceOptions')) || {};
      storage.set('workSpaceOptions', {
        ...workSpaceOptions,
        [teamId]: currentOption,
      });
    })();
  });

  const touchOption = () => {
    touchedOption = true;
  };
</script>

<div class="option">
  <div class="option__title">{msg('option_title')}</div>
  {#if option}
    <div class="option__field">
      <Toggle bind:checked={option.showDeleteButton} onToggled={touchOption} />
      <span>{msg('option_show_delete_button')}</span>
    </div>
    {#if touchedOption}
      <div transition:slide class="option__reload">{msg('option_reload_to_reflect_option')}</div>
    {/if}
  {/if}
</div>

<style lang="scss">
  @use '@/assets/css/popup-common.scss' as *;

  .option {
    &__title {
      font-weight: bold;
    }

    &__field {
      margin: 8px 4px;
    }

    &__reload {
      color: $color-grey;
      font-size: $font-size-small;
    }
  }
</style>
