<script lang="ts">
  import { slide } from 'svelte/transition';

  import * as storage from '../storage';
  import Toggle from './Toggle.svelte';
  const msg = chrome.i18n.getMessage;

  export let slackTeamId: string;

  let option: Required<storage.Option> | undefined = undefined;
  let touchedOption = false;

  // オプションの読み込み
  $: {
    (async () => {
      const workSpaceOptions = await storage.get('workSpaceOptions');

      option = { ...storage.defaultOption, ...workSpaceOptions?.[slackTeamId] };
    })();
  }

  // オプションの書き込み
  $: if (option) {
    (async () => {
      const workSpaceOptions = (await storage.get('workSpaceOptions')) || {};
      storage.set('workSpaceOptions', {
        ...workSpaceOptions,
        [slackTeamId]: option,
      });
    })();
  }

  // オプションを変更した際に呼び出す
  const touchOption = () => {
    touchedOption = true;
  };
</script>

<div class="option">
  <div class="option__title">{msg('option_title')}</div>
  {#if option}
    <div class="option__field">
      <Toggle bind:checked={option.showDeleteButton} on:toggled={touchOption} />
      <span>{msg('option_show_delete_button')}</span>
    </div>
    {#if touchedOption}
      <div transition:slide class="option__reload">{msg('option_reload_to_reflect_option')}</div>
    {/if}
  {/if}
</div>

<style lang="scss">
  @import '../../css/popup-common.scss';

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
